import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';
import { db, pool } from '../../db/client.js';
import { fetchTeams, fetchPlayers, fetchGamesByDate, fetchBoxScoresByGame, fetchLeaders, } from '../providers/balldontlie.js';
import { mapTeamToDb, mapPlayerToDb, mapGameToDb, mapBoxScoreToDb, mapLeaderToDb, } from '../maps.js';
import { upsertTeam, upsertPlayer, upsertGame, upsertBoxScore, upsertLeader, buildTeamIdMap, buildPlayerIdMap, } from '../upserts.js';
dotenv.config();
/**
 * Get yesterday's date in America/Chicago timezone
 */
function getYesterdayChicago() {
    const now = new Date();
    // Convert to Chicago time (UTC-5 or UTC-6 depending on DST)
    const chicagoOffset = -6 * 60; // CST offset in minutes
    const utcTime = now.getTime() + now.getTimezoneOffset() * 60000;
    const chicagoTime = new Date(utcTime + chicagoOffset * 60000);
    // Subtract one day
    chicagoTime.setDate(chicagoTime.getDate() - 1);
    return chicagoTime.toISOString().split('T')[0];
}
/**
 * Retry helper with exponential backoff
 */
async function retryWithBackoff(fn, maxRetries = 3, initialDelay = 1000) {
    let lastError;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            return await fn();
        }
        catch (error) {
            lastError = error;
            if (attempt < maxRetries - 1) {
                const delay = initialDelay * Math.pow(2, attempt);
                console.log(`⚠️  Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    throw lastError;
}
/**
 * Nightly ETL Job
 */
export async function runNightlyJob(options = {}) {
    const startTime = Date.now();
    console.log('🌙 Starting Nightly ETL Job');
    console.log(`📅 ${new Date().toISOString()}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    let teamsCount = 0;
    let playersCount = 0;
    let gamesCount = 0;
    let boxScoresCount = 0;
    let leadersCount = 0;
    try {
        // ========================================================================
        // Step 1: Load and upsert teams
        // ========================================================================
        console.log('🏀 Step 1: Loading teams...');
        const apiTeams = await retryWithBackoff(() => fetchTeams());
        console.log(`  📥 Fetched ${apiTeams.length} teams`);
        console.log('  💾 Upserting teams...');
        for (const apiTeam of apiTeams) {
            const teamRow = mapTeamToDb(apiTeam);
            await upsertTeam(teamRow);
            teamsCount++;
        }
        console.log(`  ✅ Upserted ${teamsCount} teams\n`);
        // Build team ID map for FK resolution
        const teamApiIds = apiTeams.map(t => t.id);
        const teamIdMap = await buildTeamIdMap(teamApiIds);
        // ========================================================================
        // Step 2: Load and upsert players (current NBA rosters only)
        // ========================================================================
        console.log('👥 Step 2: Loading current NBA players...');
        const season = options.season || new Date().getFullYear();
        console.log(`  📅 Season: ${season}`);
        // Current NBA team IDs (1-30)
        const currentNbaTeamIds = Array.from({ length: 30 }, (_, i) => i + 1);
        console.log(`  🏀 Filtering to current NBA teams: ${currentNbaTeamIds.length} teams`);
        const apiPlayers = await retryWithBackoff(() => fetchPlayers({ season, teamIds: currentNbaTeamIds }));
        console.log(`  📥 Fetched ${apiPlayers.length} players from current NBA rosters`);
        console.log('  💾 Upserting players...');
        for (const apiPlayer of apiPlayers) {
            // Resolve team FK
            const teamId = apiPlayer.team?.id
                ? teamIdMap.get(apiPlayer.team.id) ?? null
                : null;
            const playerRow = mapPlayerToDb(apiPlayer, teamId);
            await upsertPlayer(playerRow);
            playersCount++;
            if (playersCount % 100 === 0) {
                console.log(`    Processed ${playersCount}/${apiPlayers.length} players...`);
            }
        }
        console.log(`  ✅ Upserted ${playersCount} players\n`);
        // Build player ID map for FK resolution
        const playerApiIds = apiPlayers.map(p => p.id);
        const playerIdMap = await buildPlayerIdMap(playerApiIds);
        // ========================================================================
        // Step 3: Load and upsert yesterday's games
        // ========================================================================
        console.log('🎮 Step 3: Loading yesterday\'s games...');
        const yesterday = getYesterdayChicago();
        console.log(`  📅 Date: ${yesterday} (America/Chicago)`);
        const apiGames = await retryWithBackoff(() => fetchGamesByDate(yesterday));
        console.log(`  📥 Fetched ${apiGames.length} games`);
        if (apiGames.length === 0) {
            console.log('  ℹ️  No games found for yesterday (off-day)\n');
        }
        else {
            console.log('  💾 Upserting games...');
            const gameIdMap = new Map();
            for (const apiGame of apiGames) {
                // Resolve team FKs
                const homeTeamId = teamIdMap.get(apiGame.home_team.id);
                const awayTeamId = teamIdMap.get(apiGame.visitor_team.id);
                if (!homeTeamId || !awayTeamId) {
                    console.warn(`  ⚠️  Missing team for game ${apiGame.id}, skipping`);
                    continue;
                }
                const gameRow = mapGameToDb(apiGame, homeTeamId, awayTeamId);
                const gameDbId = await upsertGame(gameRow);
                gameIdMap.set(apiGame.id, gameDbId);
                gamesCount++;
            }
            console.log(`  ✅ Upserted ${gamesCount} games\n`);
            // ======================================================================
            // Step 4: Load and upsert box scores for each game
            // ======================================================================
            console.log('📊 Step 4: Loading box scores...');
            for (const apiGame of apiGames) {
                const gameDbId = gameIdMap.get(apiGame.id);
                if (!gameDbId)
                    continue;
                console.log(`  🎯 Game ${apiGame.id} (${apiGame.visitor_team.abbreviation} @ ${apiGame.home_team.abbreviation})...`);
                const apiBoxScores = await retryWithBackoff(() => fetchBoxScoresByGame(apiGame.id));
                console.log(`    📥 Fetched ${apiBoxScores.length} box scores`);
                for (const apiBoxScore of apiBoxScores) {
                    // Resolve FKs
                    const playerId = playerIdMap.get(apiBoxScore.player.id);
                    const teamId = teamIdMap.get(apiBoxScore.team.id);
                    if (!playerId || !teamId) {
                        console.warn(`    ⚠️  Missing FK for box score, skipping`);
                        continue;
                    }
                    const boxScoreRow = mapBoxScoreToDb(apiBoxScore, gameDbId, playerId, teamId);
                    await upsertBoxScore(boxScoreRow);
                    boxScoresCount++;
                }
                console.log(`    ✅ Upserted ${apiBoxScores.length} box scores`);
            }
            console.log(`  ✅ Total box scores: ${boxScoresCount}\n`);
        }
        // ========================================================================
        // Step 5: Load and upsert season leaders
        // ========================================================================
        console.log('🏆 Step 5: Loading season leaders...');
        const statTypes = ['pts', 'reb', 'ast', 'stl', 'blk'];
        for (const statType of statTypes) {
            console.log(`  📊 Loading ${statType} leaders...`);
            const apiLeaders = await retryWithBackoff(() => fetchLeaders(season, statType));
            console.log(`    📥 Fetched ${apiLeaders.length} ${statType} leaders`);
            for (const apiLeader of apiLeaders) {
                // Resolve player FK
                const playerId = playerIdMap.get(apiLeader.player.id);
                if (!playerId) {
                    console.warn(`    ⚠️  Missing player FK for leader ${apiLeader.player.first_name} ${apiLeader.player.last_name}, skipping`);
                    continue;
                }
                const leaderRow = mapLeaderToDb(apiLeader, playerId);
                await upsertLeader(leaderRow);
                leadersCount++;
            }
            console.log(`    ✅ Upserted ${apiLeaders.length} ${statType} leaders`);
        }
        console.log(`  ✅ Total leaders: ${leadersCount}\n`);
        // ========================================================================
        // Step 6: Refresh materialized views
        // ========================================================================
        console.log('🔄 Step 6: Refreshing materialized views...');
        try {
            const refreshSql = readFileSync(join(process.cwd(), 'src/sql/refresh.sql'), 'utf-8');
            await pool.query(refreshSql);
            console.log('  ✅ Materialized views refreshed\n');
        }
        catch (error) {
            console.warn('  ⚠️  Failed to refresh materialized views:', error);
            console.warn('  ℹ️  View may not exist yet. Run: psql $DATABASE_URL < src/sql/materialized_views.sql\n');
        }
        // ========================================================================
        // Summary
        // ========================================================================
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✨ Nightly ETL Job Completed Successfully!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`⏱️  Duration: ${duration}s`);
        console.log(`📊 Summary:`);
        console.log(`   • Teams: ${teamsCount}`);
        console.log(`   • Players: ${playersCount}`);
        console.log(`   • Games: ${gamesCount}`);
        console.log(`   • Box Scores: ${boxScoresCount}`);
        console.log(`   • Leaders: ${leadersCount}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }
    catch (error) {
        console.error('\n❌ Nightly ETL Job Failed!');
        console.error(error);
        throw error;
    }
}
//# sourceMappingURL=nightly.js.map
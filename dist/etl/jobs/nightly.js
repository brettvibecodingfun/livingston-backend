import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';
import { db, pool } from '../../db/client.js';
import { players, teams } from '../../db/schema.js';
import { eq, sql } from 'drizzle-orm';
import { fetchTeams, fetchPlayers, fetchGamesByDate, fetchBoxScoresByGame, fetchLeaders, fetchStandings, fetchSeasonAverages, fetchAdvancedSeasonAverages, fetchClutchSeasonAverages, fetchAdvancedClutchSeasonAverages, fetchTeamContracts, } from '../providers/balldontlie.js';
import { mapTeamToDb, mapPlayerToDb, mapGameToDb, mapBoxScoreToDb, mapLeaderToDb, mapStandingToDb, mapSeasonAverageToDb, } from '../maps.js';
import { upsertTeam, upsertPlayer, upsertGame, upsertBoxScore, upsertLeader, upsertStanding, upsertSeasonAverage, upsertClutchSeasonAverage, buildTeamIdMap, buildPlayerIdMap, updatePlayerBaseSalary, } from '../upserts.js';
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
    let standingsCount = 0;
    let seasonAveragesCount = 0;
    let contractsCount = 0;
    // Current NBA team IDs (1-30) - used throughout the job
    const currentNbaTeamIds = new Set(Array.from({ length: 30 }, (_, i) => i + 1));
    const currentNbaTeamIdsArray = Array.from({ length: 30 }, (_, i) => i + 1);
    try {
        // ========================================================================
        // Step 1: Load and upsert teams (only current NBA teams: IDs 1-30)
        // ========================================================================
        console.log('🏀 Step 1: Loading teams...');
        const apiTeams = await retryWithBackoff(() => fetchTeams());
        console.log(`  📥 Fetched ${apiTeams.length} teams`);
        // Filter to only current NBA teams (IDs 1-30)
        const filteredTeams = apiTeams.filter(team => currentNbaTeamIds.has(team.id));
        console.log(`  🔍 Filtered to ${filteredTeams.length} current NBA teams (IDs 1-30)`);
        console.log('  💾 Upserting teams...');
        for (const apiTeam of filteredTeams) {
            const teamRow = mapTeamToDb(apiTeam);
            await upsertTeam(teamRow);
            teamsCount++;
        }
        console.log(`  ✅ Upserted ${teamsCount} teams\n`);
        // Build team ID map for FK resolution (only for teams 1-30)
        const teamApiIds = filteredTeams.map(t => t.id);
        const teamIdMap = await buildTeamIdMap(teamApiIds);
        // ========================================================================
        // Step 2: Load and upsert players (current NBA rosters only)
        // ========================================================================
        console.log('👥 Step 2: Loading current NBA players...');
        const season = options.season || 2025;
        console.log(`  📅 Season: ${season}`);
        console.log(`  🏀 Filtering to current NBA teams: ${currentNbaTeamIdsArray.length} teams`);
        const apiPlayers = await retryWithBackoff(() => fetchPlayers({ season, teamIds: currentNbaTeamIdsArray }));
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
        // Build player ID map for FK resolution (initially just for players from Step 2)
        const playerApiIds = apiPlayers.map(p => p.id);
        let playerIdMap = await buildPlayerIdMap(playerApiIds);
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
            // Filter games to only include those with both teams in IDs 1-30
            const filteredGames = apiGames.filter(game => currentNbaTeamIds.has(game.home_team.id) && currentNbaTeamIds.has(game.visitor_team.id));
            console.log(`  🔍 Filtered to ${filteredGames.length} games with current NBA teams (IDs 1-30)`);
            console.log('  💾 Upserting games...');
            const gameIdMap = new Map();
            for (const apiGame of filteredGames) {
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
            for (const apiGame of filteredGames) {
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
        // Step 6: Load and upsert team standings (only for teams 1-30)
        // ========================================================================
        console.log('📈 Step 6: Loading season standings...');
        const standingsSeason = 2025;
        const apiStandings = await retryWithBackoff(() => fetchStandings(standingsSeason));
        console.log(`  📥 Fetched ${apiStandings.length} standings rows for season ${standingsSeason}`);
        // Filter standings to only current NBA teams (IDs 1-30)
        const filteredStandings = apiStandings.filter(standing => currentNbaTeamIds.has(standing.team.id));
        console.log(`  🔍 Filtered to ${filteredStandings.length} standings for current NBA teams (IDs 1-30)`);
        for (const apiStanding of filteredStandings) {
            const teamId = teamIdMap.get(apiStanding.team.id);
            if (!teamId) {
                console.warn(`  ⚠️  Missing team FK for standing ${apiStanding.team.name}, skipping`);
                continue;
            }
            const standingRow = mapStandingToDb(apiStanding, teamId);
            await upsertStanding(standingRow);
            standingsCount++;
        }
        console.log(`  ✅ Upserted ${standingsCount} standings\n`);
        // ========================================================================
        // Step 7: Load and upsert season averages (includes shooting percentages)
        // ========================================================================
        console.log('📊 Step 7: Loading season averages...');
        // Get ALL player API IDs from database for season averages fetch
        // (not just the ones we fetched in Step 2, to ensure we get averages for all players)
        console.log('  🔍 Fetching all player API IDs from database...');
        const allPlayersInDb = await db
            .select({ apiId: players.apiId })
            .from(players);
        const playerApiIdsForAverages = allPlayersInDb.map(p => p.apiId);
        console.log(`  📊 Found ${playerApiIdsForAverages.length} total players in database`);
        // Rebuild player ID map to include ALL players in database (not just newly fetched ones)
        // This ensures we can match season averages for any player, including ones that weren't
        // fetched in Step 2 (e.g., rookies or players not on current NBA teams)
        playerIdMap = await buildPlayerIdMap(playerApiIdsForAverages);
        // Fetch season averages filtered by ALL player IDs in database
        const apiSeasonAverages = await retryWithBackoff(() => fetchSeasonAverages(season, 'regular', playerApiIdsForAverages));
        console.log(`  📥 Fetched ${apiSeasonAverages.length} season averages for season ${season}`);
        // Track which player IDs we requested vs which we got back
        const requestedPlayerIds = new Set(playerApiIdsForAverages);
        const receivedPlayerIds = new Set();
        for (const apiSeasonAverage of apiSeasonAverages) {
            // player.id and season are guaranteed by fetchSeasonAverages filter
            const playerApiId = apiSeasonAverage.player?.id;
            if (!playerApiId) {
                console.warn(`  ⚠️  Season average entry missing player.id, skipping`);
                continue;
            }
            receivedPlayerIds.add(playerApiId);
            // Use the full player ID map that includes all database players
            const playerId = playerIdMap.get(playerApiId);
            if (!playerId) {
                console.warn(`  ⚠️  Missing player FK for season average player_id ${playerApiId}, skipping`);
                continue;
            }
            try {
                const seasonAverageRow = mapSeasonAverageToDb(apiSeasonAverage, playerId);
                await upsertSeasonAverage(seasonAverageRow);
                seasonAveragesCount++;
            }
            catch (error) {
                console.warn(`  ⚠️  Error mapping season average for player_id ${playerApiId}:`, error);
                continue;
            }
        }
        // Log missing players (requested but not returned by API)
        const missingPlayerIds = Array.from(requestedPlayerIds).filter(id => !receivedPlayerIds.has(id));
        if (missingPlayerIds.length > 0) {
            console.log(`  ℹ️  ${missingPlayerIds.length} players requested but no season averages returned by API`);
            // Check if Cooper Flagg is in the missing list
            if (missingPlayerIds.includes(1057262088)) {
                console.log(`  🔍 Cooper Flagg (api_id: 1057262088) was requested but not returned by API`);
            }
        }
        console.log(`  ✅ Upserted ${seasonAveragesCount} season averages\n`);
        // ========================================================================
        // Step 7b: Load advanced season averages
        // ========================================================================
        console.log('📊 Step 7b: Loading advanced season averages...');
        let advancedSeasonAveragesCount = 0;
        // Fetch advanced season averages for the same players
        const apiAdvancedSeasonAverages = await retryWithBackoff(() => fetchAdvancedSeasonAverages(season, 'regular', playerApiIdsForAverages));
        console.log(`  📥 Fetched ${apiAdvancedSeasonAverages.length} advanced season averages for season ${season}`);
        for (const apiAdvancedSeasonAverage of apiAdvancedSeasonAverages) {
            const playerApiId = apiAdvancedSeasonAverage.player?.id;
            if (!playerApiId) {
                console.warn(`  ⚠️  Advanced season average entry missing player.id, skipping`);
                continue;
            }
            const playerId = playerIdMap.get(playerApiId);
            if (!playerId) {
                console.warn(`  ⚠️  Missing player FK for advanced season average player_id ${playerApiId}, skipping`);
                continue;
            }
            try {
                // Map advanced stats and upsert (will merge with existing base stats)
                const seasonAverageRow = mapSeasonAverageToDb(apiAdvancedSeasonAverage, playerId);
                await upsertSeasonAverage(seasonAverageRow);
                advancedSeasonAveragesCount++;
            }
            catch (error) {
                console.warn(`  ⚠️  Error mapping advanced season average for player_id ${playerApiId}:`, error);
                continue;
            }
        }
        console.log(`  ✅ Upserted ${advancedSeasonAveragesCount} advanced season averages\n`);
        // ========================================================================
        // Step 7c: Load clutch season averages
        // ========================================================================
        console.log('📊 Step 7c: Loading clutch season averages...');
        let clutchSeasonAveragesCount = 0;
        // Fetch clutch season averages for the same players
        const apiClutchSeasonAverages = await retryWithBackoff(() => fetchClutchSeasonAverages(season, 'regular', playerApiIdsForAverages));
        console.log(`  📥 Fetched ${apiClutchSeasonAverages.length} clutch season averages for season ${season}`);
        for (const apiClutchSeasonAverage of apiClutchSeasonAverages) {
            const playerApiId = apiClutchSeasonAverage.player?.id;
            if (!playerApiId) {
                console.warn(`  ⚠️  Clutch season average entry missing player.id, skipping`);
                continue;
            }
            const playerId = playerIdMap.get(playerApiId);
            if (!playerId) {
                console.warn(`  ⚠️  Missing player FK for clutch season average player_id ${playerApiId}, skipping`);
                continue;
            }
            try {
                // Map clutch stats and upsert
                const clutchSeasonAverageRow = mapSeasonAverageToDb(apiClutchSeasonAverage, playerId);
                await upsertClutchSeasonAverage(clutchSeasonAverageRow);
                clutchSeasonAveragesCount++;
            }
            catch (error) {
                console.warn(`  ⚠️  Error mapping clutch season average for player_id ${playerApiId}:`, error);
                continue;
            }
        }
        console.log(`  ✅ Upserted ${clutchSeasonAveragesCount} clutch season averages\n`);
        // ========================================================================
        // Step 7d: Load advanced clutch season averages
        // ========================================================================
        console.log('📊 Step 7d: Loading advanced clutch season averages...');
        let advancedClutchSeasonAveragesCount = 0;
        // Fetch advanced clutch season averages for the same players
        const apiAdvancedClutchSeasonAverages = await retryWithBackoff(() => fetchAdvancedClutchSeasonAverages(season, 'regular', playerApiIdsForAverages));
        console.log(`  📥 Fetched ${apiAdvancedClutchSeasonAverages.length} advanced clutch season averages for season ${season}`);
        for (const apiAdvancedClutchSeasonAverage of apiAdvancedClutchSeasonAverages) {
            const playerApiId = apiAdvancedClutchSeasonAverage.player?.id;
            if (!playerApiId) {
                console.warn(`  ⚠️  Advanced clutch season average entry missing player.id, skipping`);
                continue;
            }
            const playerId = playerIdMap.get(playerApiId);
            if (!playerId) {
                console.warn(`  ⚠️  Missing player FK for advanced clutch season average player_id ${playerApiId}, skipping`);
                continue;
            }
            try {
                // Map advanced clutch stats and upsert (will merge with existing base clutch stats)
                const clutchSeasonAverageRow = mapSeasonAverageToDb(apiAdvancedClutchSeasonAverage, playerId);
                await upsertClutchSeasonAverage(clutchSeasonAverageRow);
                advancedClutchSeasonAveragesCount++;
            }
            catch (error) {
                console.warn(`  ⚠️  Error mapping advanced clutch season average for player_id ${playerApiId}:`, error);
                continue;
            }
        }
        console.log(`  ✅ Upserted ${advancedClutchSeasonAveragesCount} advanced clutch season averages\n`);
        // ========================================================================
        // Step 8: Load and update player contracts (base salary) - only teams 1-30
        // ========================================================================
        console.log('💰 Step 8: Loading player contracts...');
        // Get only current NBA teams (IDs 1-30) from database to fetch contracts
        const allTeamsInDb = await db
            .select({ apiId: teams.apiId, id: teams.id })
            .from(teams)
            .where(sql `${teams.apiId} <= 30`);
        console.log(`  📋 Found ${allTeamsInDb.length} current NBA teams in database (IDs 1-30)`);
        // Build team API ID to DB ID map
        const teamApiIdToDbId = new Map();
        for (const team of allTeamsInDb) {
            teamApiIdToDbId.set(team.apiId, team.id);
        }
        // Fetch contracts for each team (only teams 1-30)
        for (const team of allTeamsInDb) {
            try {
                console.log(`  📥 Fetching contracts for team API ID ${team.apiId}...`);
                const apiContracts = await retryWithBackoff(() => fetchTeamContracts(team.apiId, season));
                if (apiContracts.length === 0) {
                    console.log(`    ℹ️  No contracts found for team API ID ${team.apiId}`);
                    continue;
                }
                console.log(`    📊 Found ${apiContracts.length} contracts`);
                // Update each player's base salary from their contract
                for (const contract of apiContracts) {
                    const playerApiId = contract.player_id;
                    const baseSalary = contract.base_salary;
                    // Update the player's base salary
                    await updatePlayerBaseSalary(playerApiId, baseSalary);
                    contractsCount++;
                }
                console.log(`    ✅ Updated ${apiContracts.length} player contracts`);
                // Throttle between teams to respect rate limits (200-300ms)
                await new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * 100) + 200));
            }
            catch (error) {
                console.warn(`  ⚠️  Error fetching contracts for team API ID ${team.apiId}:`, error);
                continue;
            }
        }
        console.log(`  ✅ Total contracts processed: ${contractsCount}\n`);
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
        console.log(`   • Standings: ${standingsCount}`);
        console.log(`   • Season Averages: ${seasonAveragesCount}`);
        console.log(`   • Contracts: ${contractsCount}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }
    catch (error) {
        console.error('\n❌ Nightly ETL Job Failed!');
        console.error(error);
        throw error;
    }
}
//# sourceMappingURL=nightly.js.map
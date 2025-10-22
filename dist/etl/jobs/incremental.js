import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';
import { pool } from '../../db/client.js';
import { fetchGamesByDate, fetchBoxScoresByGame, } from '../providers/balldontlie.js';
import { mapGameToDb, mapBoxScoreToDb, } from '../maps.js';
import { upsertGame, upsertBoxScore, buildTeamIdMap, buildPlayerIdMap, } from '../upserts.js';
dotenv.config();
/**
 * Get today's date in America/Chicago timezone
 */
function getTodayChicago() {
    const now = new Date();
    // Convert to Chicago time (UTC-5 or UTC-6 depending on DST)
    const chicagoOffset = -6 * 60; // CST offset in minutes
    const utcTime = now.getTime() + now.getTimezoneOffset() * 60000;
    const chicagoTime = new Date(utcTime + chicagoOffset * 60000);
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
 * Incremental ETL Job (runs hourly on game days)
 */
export async function runIncrementalJob(options = {}) {
    const startTime = Date.now();
    console.log('⚡ Starting Incremental ETL Job');
    console.log(`📅 ${new Date().toISOString()}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    let gamesCount = 0;
    let boxScoresCount = 0;
    try {
        // ========================================================================
        // Step 1: Fetch today's games
        // ========================================================================
        console.log('🎮 Step 1: Loading today\'s games...');
        const today = getTodayChicago();
        console.log(`  📅 Date: ${today} (America/Chicago)`);
        const apiGames = await retryWithBackoff(() => fetchGamesByDate(today));
        console.log(`  📥 Fetched ${apiGames.length} games`);
        if (apiGames.length === 0) {
            console.log('  ℹ️  No games scheduled for today\n');
            const duration = ((Date.now() - startTime) / 1000).toFixed(2);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('✨ Incremental ETL Job Completed');
            console.log(`⏱️  Duration: ${duration}s`);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
            return;
        }
        // Build team and player ID maps for FK resolution
        const teamApiIds = [
            ...apiGames.map(g => g.home_team.id),
            ...apiGames.map(g => g.visitor_team.id),
        ];
        const teamIdMap = await buildTeamIdMap(teamApiIds);
        // ========================================================================
        // Step 2: Upsert games
        // ========================================================================
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
            // Log game status
            const status = apiGame.home_team_score !== null && apiGame.visitor_team_score !== null
                ? `${apiGame.visitor_team.abbreviation} ${apiGame.visitor_team_score} @ ${apiGame.home_team.abbreviation} ${apiGame.home_team_score}`
                : `${apiGame.visitor_team.abbreviation} @ ${apiGame.home_team.abbreviation}`;
            console.log(`    • ${status} - ${apiGame.status}`);
        }
        console.log(`  ✅ Upserted ${gamesCount} games\n`);
        // ========================================================================
        // Step 3: Fetch and upsert box scores for each game
        // ========================================================================
        console.log('📊 Step 2: Loading box scores...');
        for (const apiGame of apiGames) {
            const gameDbId = gameIdMap.get(apiGame.id);
            if (!gameDbId)
                continue;
            console.log(`  🎯 Game ${apiGame.id} (${apiGame.visitor_team.abbreviation} @ ${apiGame.home_team.abbreviation})...`);
            try {
                const apiBoxScores = await retryWithBackoff(() => fetchBoxScoresByGame(apiGame.id));
                console.log(`    📥 Fetched ${apiBoxScores.length} box scores`);
                if (apiBoxScores.length === 0) {
                    console.log(`    ℹ️  No box scores available yet (game may not have started)`);
                    continue;
                }
                // Build player ID map
                const playerApiIds = apiBoxScores.map(bs => bs.player.id);
                const playerIdMap = await buildPlayerIdMap(playerApiIds);
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
            catch (error) {
                console.warn(`    ⚠️  Failed to fetch box scores for game ${apiGame.id}:`, error);
            }
        }
        console.log(`  ✅ Total box scores: ${boxScoresCount}\n`);
        // ========================================================================
        // Optional: Refresh materialized views
        // ========================================================================
        if (options.refreshMv) {
            console.log('🔄 Step 3: Refreshing materialized views...');
            try {
                const refreshSql = readFileSync(join(process.cwd(), 'src/sql/refresh.sql'), 'utf-8');
                await pool.query(refreshSql);
                console.log('  ✅ Materialized views refreshed\n');
            }
            catch (error) {
                console.warn('  ⚠️  Failed to refresh materialized views:', error);
            }
        }
        // ========================================================================
        // Summary
        // ========================================================================
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✨ Incremental ETL Job Completed Successfully!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`⏱️  Duration: ${duration}s`);
        console.log(`📊 Summary:`);
        console.log(`   • Games Updated: ${gamesCount}`);
        console.log(`   • Box Scores Updated: ${boxScoresCount}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }
    catch (error) {
        console.error('\n❌ Incremental ETL Job Failed!');
        console.error(error);
        throw error;
    }
}
//# sourceMappingURL=incremental.js.map
/**
 * Historical Season Averages ETL Job
 * 
 * Fetches historical season averages for all players in a given season
 * and stores them in the historical_season_averages table.
 * 
 * Note: Season is incremented by 1 when storing (API 2024 -> DB 2025)
 */

import dotenv from 'dotenv';

// Load environment variables from .env file BEFORE importing providers
// This ensures BALLDONTLIE_KEY is available when the provider module loads
dotenv.config();

import { fetchHistoricalSeasonAverages } from '../providers/balldontlie.js';
import { mapHistoricalSeasonAverageToDb, mapPlayerToDb } from '../maps.js';
import { upsertHistoricalSeasonAverage, buildPlayerIdMap, upsertPlayer } from '../upserts.js';

export interface HistoricalJobOptions {
  season: number;
  seasonType?: string;
}

export async function runHistoricalJob(options: HistoricalJobOptions): Promise<void> {
  const { season, seasonType = 'regular' } = options;
  const dbSeason = season + 1; // Store as season + 1 (API 2024 -> DB 2025)

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Historical Season Averages ETL Job');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📅 API Season: ${season} (will be stored as ${dbSeason})`);
  console.log(`🏀 Season Type: ${seasonType}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    // Step 1: Fetch all historical season averages from API
    console.log('Step 1: Fetching historical season averages from API...');
    const apiAverages = await fetchHistoricalSeasonAverages(season, seasonType, 100);
    
    if (apiAverages.length === 0) {
      console.log('⚠️  No season averages found for this season');
      return;
    }

    console.log(`✅ Fetched ${apiAverages.length} season averages\n`);

    // Step 2: Create/upsert players and build player ID map (API ID -> DB ID)
    console.log('Step 2: Creating/updating players and building player ID map...');
    const apiPlayerIds = [...new Set(apiAverages.map(avg => avg.player?.id).filter((id): id is number => id !== undefined && id !== null))];
    
    // First, get existing players
    let playerIdMap = await buildPlayerIdMap(apiPlayerIds);
    let createdCount = 0;
    
    // Create any missing players
    for (const apiAverage of apiAverages) {
      const apiPlayer = apiAverage.player;
      if (!apiPlayer?.id) continue;
      
      if (!playerIdMap.has(apiPlayer.id)) {
        // Player doesn't exist, create them
        try {
          const playerRow = mapPlayerToDb(apiPlayer as any, null); // No team for historical players
          const dbPlayerId = await upsertPlayer(playerRow);
          playerIdMap.set(apiPlayer.id, dbPlayerId);
          createdCount++;
        } catch (error) {
          console.error(`  ⚠️  Error creating player ${apiPlayer.id}:`, error);
        }
      }
    }
    
    console.log(`✅ Mapped ${playerIdMap.size} players (created ${createdCount} new players)\n`);

    // Step 3: Process and upsert each season average
    console.log('Step 3: Processing and upserting season averages...');
    let successCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const apiAverage of apiAverages) {
      try {
        const apiPlayerId = apiAverage.player?.id;
        if (!apiPlayerId) {
          console.log(`  ⚠️  Skipping average with no player ID`);
          skippedCount++;
          continue;
        }

        const dbPlayerId = playerIdMap.get(apiPlayerId);
        if (!dbPlayerId) {
          console.log(`  ⚠️  Skipping player ${apiPlayerId} (could not create/find in database)`);
          skippedCount++;
          continue;
        }

        // Map API response to DB format
        const dbRow = mapHistoricalSeasonAverageToDb(apiAverage, dbPlayerId);

        // Upsert to database
        await upsertHistoricalSeasonAverage(dbRow);
        successCount++;

        // Log progress every 50 records
        if (successCount % 50 === 0) {
          console.log(`  ✅ Processed ${successCount} records...`);
        }
      } catch (error) {
        console.error(`  ❌ Error processing season average for player ${apiAverage.player?.id}:`, error);
        errorCount++;
      }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Historical Season Averages ETL Complete');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ Successfully processed: ${successCount}`);
    console.log(`⚠️  Skipped: ${skippedCount}`);
    if (errorCount > 0) {
      console.log(`❌ Errors: ${errorCount}`);
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  } catch (error) {
    console.error('❌ Fatal error in historical season averages ETL:', error);
    throw error;
  }
}

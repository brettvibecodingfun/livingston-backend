/**
 * Clustering ETL Job
 * Runs K-means clustering on historical player data by age
 * Creates clusters for ages 19-40 with dynamic splitting for large clusters
 * 
 * Clustering parameters:
 * - Ages 19-20: 10 initial clusters (fewer players at these ages)
 * - Ages 21-35: 20 initial clusters (more players, need more granularity)
 * - Ages 36-40: 10 initial clusters (fewer players at older ages)
 * - Max cluster size: 12 players (reduced for more specificity)
 */

import dotenv from 'dotenv';
// Load environment variables BEFORE importing other modules
dotenv.config();

import { db, pool } from '../../db/client.js';
import { historicalSeasonAverages, seasonAverages, playerClusters, players } from '../../db/schema.js';
import { and, eq, sql, inArray } from 'drizzle-orm';
import type { HistoricalSeasonAverage, SeasonAverage } from '../../db/schema.js';
import {
  extractFeaturesFromHistorical,
  extractFeaturesFromCurrent,
  processClustersWithSplitting,
  type PlayerDataPoint,
} from '../clustering.js';

export interface ClusteringJobOptions {
  minGames?: number;
  minMinutes?: number;
  maxClusterSize?: number;
  currentSeason?: number;
}

/**
 * Get the number of clusters for a given age
 * Adjusted based on typical player count per age group
 * Ages 19-20: 10 clusters (fewer players at these ages)
 * Ages 21-35: 20 clusters (more players, need more granularity)
 * Ages 36-40: 10 clusters (fewer players at older ages)
 */
function getClusterCount(age: number): number {
  if (age >= 19 && age <= 20) {
    return 10; // Fewer clusters for younger ages with fewer players
  } else if (age >= 21 && age <= 35) {
    return 20; // More clusters for prime ages with many players
  } else if (age >= 36 && age <= 40) {
    return 10; // Fewer clusters for older ages with fewer players
  } else {
    throw new Error(`Invalid age: ${age}. Must be between 19 and 40.`);
  }
}

/**
 * Run clustering for a specific age
 */
async function clusterByAge(
  age: number,
  options: Required<ClusteringJobOptions>
): Promise<{ processed: number; clusters: number }> {
  console.log(`\n  📊 Processing age ${age}...`);

  // Fetch all historical season averages for this age
  const historicalAverages = await db
    .select()
    .from(historicalSeasonAverages)
    .where(
      and(
        sql`${historicalSeasonAverages.age} = ${age}`,
        sql`${historicalSeasonAverages.gamesPlayed} >= ${options.minGames}`,
        sql`${historicalSeasonAverages.minutes} >= ${options.minMinutes}`
      )
    );

  // Fetch current season averages for this age
  // Query for season = currentSeason - 1 (e.g., 2025) but will store as currentSeason (e.g., 2026)
  const dbSeason = options.currentSeason - 1;
  const currentAverages = await db
    .select()
    .from(seasonAverages)
    .where(
      and(
        eq(seasonAverages.season, dbSeason),
        sql`${seasonAverages.age} = ${age}`,
        sql`${seasonAverages.gamesPlayed} >= ${options.minGames}`,
        sql`${seasonAverages.minutes} >= ${options.minMinutes}`
      )
    );

  const totalAverages = historicalAverages.length + currentAverages.length;

  if (totalAverages === 0) {
    console.log(`    ⚠️  No players found for age ${age}`);
    return { processed: 0, clusters: 0 };
  }

  console.log(`    📥 Found ${historicalAverages.length} historical + ${currentAverages.length} current = ${totalAverages} player-seasons`);

  // Extract features and build data points
  const dataPoints: PlayerDataPoint[] = [];
  
  // Track which (playerId, season) combinations we've already processed
  // This prevents duplicates when a player exists in both historical and current season tables
  const processedPlayerSeasons = new Set<string>();

  // Process current season averages FIRST (they take precedence)
  // This ensures if a player exists in both tables, we use the current season data
  const currentPlayerIds = [...new Set(currentAverages.map(a => a.playerId))];
  const playerMap = new Map<number, string>();
  
  if (currentPlayerIds.length > 0) {
    const playerRecords = await db
      .select({ id: players.id, fullName: players.fullName })
      .from(players)
      .where(inArray(players.id, currentPlayerIds));
    
    for (const p of playerRecords) {
      playerMap.set(p.id, p.fullName);
    }
  }

  for (const avg of currentAverages) {
    const features = extractFeaturesFromCurrent(avg);
    if (features) {
      // Use currentSeason (2026) for cluster assignment, even though DB has 2025
      const clusterSeason = options.currentSeason;
      const playerSeasonKey = `${avg.playerId}-${clusterSeason}`;
      if (!processedPlayerSeasons.has(playerSeasonKey)) {
        const playerName = playerMap.get(avg.playerId) || `Player ${avg.playerId}`;
        dataPoints.push({
          playerId: avg.playerId,
          season: clusterSeason, // Store as 2026, not the DB value (2025)
          playerName,
          historicalSeasonAverageId: null,
          seasonAverageId: avg.id,
          features,
        });
        processedPlayerSeasons.add(playerSeasonKey);
      }
    }
  }

  // Process historical averages (skip any that were already processed from current season)
  for (const avg of historicalAverages) {
    const features = extractFeaturesFromHistorical(avg);
    if (features) {
      const playerSeasonKey = `${avg.playerId}-${avg.season}`;
      // Skip if we already processed this player-season from current season averages
      if (!processedPlayerSeasons.has(playerSeasonKey)) {
        dataPoints.push({
          playerId: avg.playerId,
          season: avg.season,
          playerName: avg.playerName,
          historicalSeasonAverageId: avg.id,
          seasonAverageId: null,
          features,
        });
        processedPlayerSeasons.add(playerSeasonKey);
      }
    }
  }

  if (dataPoints.length === 0) {
    console.log(`    ⚠️  No valid data points after feature extraction`);
    return { processed: 0, clusters: 0 };
  }

  console.log(`    ✅ Extracted features for ${dataPoints.length} players`);

  // Get initial cluster count for this age
  const initialK = getClusterCount(age);

  // Run clustering with dynamic splitting
  console.log(`    🔄 Running K-means with k=${initialK}...`);
  const clusterAssignments = processClustersWithSplitting(
    dataPoints,
    initialK,
    options.maxClusterSize
  );

  // Count unique clusters
  const uniqueClusters = new Set(clusterAssignments.values());
  console.log(`    ✅ Created ${uniqueClusters.size} clusters (initial: ${initialK})`);

  // Delete existing clusters for this age
  await db.delete(playerClusters).where(sql`${playerClusters.age} = ${age}`);
  console.log(`    🗑️  Deleted existing clusters for age ${age}`);

  // Insert new cluster assignments
  const clusterRows = Array.from(clusterAssignments.entries()).map(([idx, clusterNum]) => {
    const dp = dataPoints[idx]!;
    return {
      age,
      clusterNumber: clusterNum,
      playerId: dp.playerId,
      season: dp.season,
      playerName: dp.playerName,
      historicalSeasonAverageId: dp.historicalSeasonAverageId,
      seasonAverageId: dp.seasonAverageId,
    };
  });

  // Batch insert (PostgreSQL can handle large inserts efficiently)
  if (clusterRows.length > 0) {
    await db.insert(playerClusters).values(clusterRows);
    console.log(`    💾 Inserted ${clusterRows.length} cluster assignments`);
  }

  return { processed: clusterRows.length, clusters: uniqueClusters.size };
}

/**
 * Main clustering ETL job
 */
export async function runClusteringJob(
  options: ClusteringJobOptions = {}
): Promise<void> {
  const {
    minGames = 20,
    minMinutes = 15,
    maxClusterSize = 12, // Reduced from 50 for more granular clusters
    currentSeason = 2026,
  } = options;

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔮 Player Clustering ETL Job');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📅 ${new Date().toISOString()}`);
  console.log(`📊 Clustering players by age (19-40)`);
  console.log(`📋 Filters: min ${minGames} games, min ${minMinutes} min/game`);
  console.log(`🔢 Max cluster size: ${maxClusterSize}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const startTime = Date.now();
  let totalProcessed = 0;
  let totalClusters = 0;

  try {
    // Process each age from 19 to 40
    for (let age = 19; age <= 40; age++) {
      try {
        const result = await clusterByAge(age, {
          minGames,
          minMinutes,
          maxClusterSize,
          currentSeason,
        });
        totalProcessed += result.processed;
        totalClusters += result.clusters;
      } catch (error) {
        console.error(`  ❌ Error processing age ${age}:`, error);
        // Continue with next age
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Clustering ETL Complete');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ Total players processed: ${totalProcessed}`);
    console.log(`✅ Total clusters created: ${totalClusters}`);
    console.log(`⏱️  Duration: ${duration}s`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  } catch (error) {
    console.error('❌ Fatal error in clustering ETL:', error);
    throw error;
  }
}

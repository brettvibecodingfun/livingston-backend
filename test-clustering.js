#!/usr/bin/env node
/**
 * Test script for clustering feature
 * 
 * Usage:
 *   node test-clustering.js
 *   node test-clustering.js --age 22
 *   node test-clustering.js --player "Anthony Edwards"
 */

import dotenv from 'dotenv';
dotenv.config();

import { db, pool } from './dist/db/client.js';
import { historicalSeasonAverages, seasonAverages, playerClusters, players } from './dist/db/schema.js';
import { sql, eq, and, like } from 'drizzle-orm';

async function checkDataAvailability() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Step 1: Checking Data Availability');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Check historical data
  const historicalStats = await db
    .select({
      total: sql`COUNT(*)`,
      uniqueAges: sql`COUNT(DISTINCT ${historicalSeasonAverages.age})`,
      minAge: sql`MIN(${historicalSeasonAverages.age})`,
      maxAge: sql`MAX(${historicalSeasonAverages.age})`,
      uniquePlayers: sql`COUNT(DISTINCT ${historicalSeasonAverages.playerId})`,
    })
    .from(historicalSeasonAverages)
    .where(
      and(
        sql`${historicalSeasonAverages.gamesPlayed} >= 20`,
        sql`${historicalSeasonAverages.minutes} >= 15`
      )
    );

  console.log('📈 Historical Season Averages:');
  console.log(`   Total records: ${historicalStats[0]?.total || 0}`);
  console.log(`   Unique ages: ${historicalStats[0]?.uniqueAges || 0}`);
  console.log(`   Age range: ${historicalStats[0]?.minAge || 'N/A'} - ${historicalStats[0]?.maxAge || 'N/A'}`);
  console.log(`   Unique players: ${historicalStats[0]?.uniquePlayers || 0}\n`);

  // Check current season data (stored as 2025 in DB, but interpreted as 2026 for clustering)
  const currentStats = await db
    .select({
      total: sql`COUNT(*)`,
      uniqueAges: sql`COUNT(DISTINCT ${seasonAverages.age})`,
      minAge: sql`MIN(${seasonAverages.age})`,
      maxAge: sql`MAX(${seasonAverages.age})`,
      uniquePlayers: sql`COUNT(DISTINCT ${seasonAverages.playerId})`,
    })
    .from(seasonAverages)
    .where(
      and(
        eq(seasonAverages.season, 2025), // Query DB value (2025)
        sql`${seasonAverages.gamesPlayed} >= 20`,
        sql`${seasonAverages.minutes} >= 15`
      )
    );

  console.log('📈 Current Season Averages (stored as 2025 in DB, interpreted as 2026 for clustering):');
  console.log(`   Total records: ${currentStats[0]?.total || 0}`);
  console.log(`   Unique ages: ${currentStats[0]?.uniqueAges || 0}`);
  console.log(`   Age range: ${currentStats[0]?.minAge || 'N/A'} - ${currentStats[0]?.maxAge || 'N/A'}`);
  console.log(`   Unique players: ${currentStats[0]?.uniquePlayers || 0}\n`);

  // Check data by age
  console.log('📊 Data availability by age (19-40):');
  const ageData = await db.execute(sql`
    SELECT 
      age,
      COUNT(*) FILTER (WHERE source = 'historical') as historical_count,
      COUNT(*) FILTER (WHERE source = 'current') as current_count,
      COUNT(*) as total_count
    FROM (
      SELECT age, 'historical' as source
      FROM historical_season_averages
      WHERE games_played >= 20 AND minutes >= 15
      UNION ALL
      SELECT age, 'current' as source
      FROM season_averages
      WHERE season = 2025 AND games_played >= 20 AND minutes >= 15
    ) combined
    WHERE age BETWEEN 19 AND 40
    GROUP BY age
    ORDER BY age
  `);

  if (ageData.rows.length === 0) {
    console.log('   ⚠️  No data found for ages 19-40!\n');
    return false;
  }

  console.log('   Age | Historical | Current | Total');
  console.log('   ' + '─'.repeat(40));
  ageData.rows.forEach(row => {
    console.log(`   ${String(row.age).padStart(3)} | ${String(row.historical_count || 0).padStart(10)} | ${String(row.current_count || 0).padStart(7)} | ${row.total_count || 0}`);
  });
  console.log('');

  return true;
}

async function checkClusteringResults(ageFilter = null) {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔮 Step 2: Checking Clustering Results');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const whereClause = ageFilter 
    ? sql`${playerClusters.age} = ${ageFilter}`
    : sql`1=1`;

  // Check if clusters exist
  const clusterStats = await db
    .select({
      age: playerClusters.age,
      numClusters: sql`COUNT(DISTINCT ${playerClusters.clusterNumber})`,
      totalAssignments: sql`COUNT(*)`,
      uniquePlayers: sql`COUNT(DISTINCT ${playerClusters.playerId})`,
    })
    .from(playerClusters)
    .where(whereClause)
    .groupBy(playerClusters.age)
    .orderBy(playerClusters.age);

  if (clusterStats.length === 0) {
    console.log('   ⚠️  No clusters found! Run the clustering job first:\n');
    console.log('   npm run etl:clustering\n');
    return false;
  }

  console.log('📊 Cluster Statistics:');
  console.log('   Age | Clusters | Assignments | Unique Players');
  console.log('   ' + '─'.repeat(50));
  clusterStats.forEach(stat => {
    console.log(`   ${String(stat.age).padStart(3)} | ${String(stat.numClusters).padStart(8)} | ${String(stat.totalAssignments).padStart(11)} | ${stat.uniquePlayers}`);
  });
  console.log('');

  // Check for oversized clusters
  const oversizedClusters = await db.execute(sql`
    SELECT 
      age,
      cluster_number,
      COUNT(*) as cluster_size
    FROM player_clusters
    GROUP BY age, cluster_number
    HAVING COUNT(*) > 50
    ORDER BY age, cluster_number
  `);

  if (oversizedClusters.rows.length > 0) {
    console.log('   ⚠️  Found clusters with >50 players (should be split):');
    oversizedClusters.rows.forEach(row => {
      console.log(`   Age ${row.age}, Cluster ${row.cluster_number}: ${row.cluster_size} players`);
    });
    console.log('');
  } else {
    console.log('   ✅ All clusters are within size limit (≤50 players)\n');
  }

  return true;
}

async function testPlayerComparison(playerName, age) {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🔍 Step 3: Testing Player Comparison`);
  console.log(`   Player: ${playerName}, Age: ${age}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Find player
  const player = await db
    .select()
    .from(players)
    .where(like(players.fullName, `%${playerName}%`))
    .limit(1);

  if (player.length === 0) {
    console.log(`   ❌ Player "${playerName}" not found in database\n`);
    return;
  }

  const playerId = player[0].id;
  console.log(`   ✅ Found: ${player[0].fullName} (ID: ${playerId})\n`);

  // Find their cluster
  const playerCluster = await db
    .select()
    .from(playerClusters)
    .where(
      and(
        eq(playerClusters.playerId, playerId),
        eq(playerClusters.age, age)
      )
    )
    .limit(1);

  if (playerCluster.length === 0) {
    console.log(`   ⚠️  No cluster found for ${playerName} at age ${age}`);
    console.log(`   Make sure they meet the criteria (min 20 games, min 15 min/game)\n`);
    return;
  }

  const cluster = playerCluster[0];
  console.log(`   📊 Cluster Info:`);
  console.log(`      Age: ${cluster.age}`);
  console.log(`      Cluster Number: ${cluster.clusterNumber}`);
  console.log(`      Season: ${cluster.season}\n`);

  // Find similar players
  const similarPlayers = await db.execute(sql`
    SELECT 
      pc.player_name,
      pc.season,
      COALESCE(hsa.points, sa.points) as points,
      COALESCE(hsa.assists, sa.assists) as assists,
      COALESCE(hsa.rebounds, sa.rebounds) as rebounds,
      COALESCE(hsa.fg_pct, sa.fg_pct) as fg_pct,
      COALESCE(hsa.three_pct, sa.three_pct) as three_pct,
      COALESCE(hsa.ft_pct, sa.ft_pct) as ft_pct
    FROM player_clusters pc
    LEFT JOIN historical_season_averages hsa ON pc.historical_season_average_id = hsa.id
    LEFT JOIN season_averages sa ON pc.season_average_id = sa.id
    WHERE pc.age = ${cluster.age}
      AND pc.cluster_number = ${cluster.clusterNumber}
      AND pc.player_id != ${playerId}
    ORDER BY COALESCE(hsa.points, sa.points) DESC
    LIMIT 10
  `);

  console.log(`   👥 Top 10 Similar Players in Cluster ${cluster.clusterNumber}:`);
  console.log('   ' + '─'.repeat(100));
  console.log('   Player Name                    | Season | PTS  | AST  | REB  | FG%   | 3P%   | FT%');
  console.log('   ' + '─'.repeat(100));
  similarPlayers.rows.forEach(row => {
    const name = (row.player_name || '').substring(0, 30).padEnd(30);
    const season = String(row.season || '').padStart(6);
    const pts = (row.points != null && typeof row.points === 'number') ? row.points.toFixed(1).padStart(5) : '  N/A';
    const ast = (row.assists != null && typeof row.assists === 'number') ? row.assists.toFixed(1).padStart(5) : '  N/A';
    const reb = (row.rebounds != null && typeof row.rebounds === 'number') ? row.rebounds.toFixed(1).padStart(5) : '  N/A';
    const fg = (row.fg_pct != null && typeof row.fg_pct === 'number') ? (row.fg_pct * 100).toFixed(1).padStart(5) + '%' : '  N/A';
    const three = (row.three_pct != null && typeof row.three_pct === 'number') ? (row.three_pct * 100).toFixed(1).padStart(5) + '%' : '  N/A';
    const ft = (row.ft_pct != null && typeof row.ft_pct === 'number') ? (row.ft_pct * 100).toFixed(1).padStart(5) + '%' : '  N/A';
    console.log(`   ${name} | ${season} | ${pts} | ${ast} | ${reb} | ${fg} | ${three} | ${ft}`);
  });
  console.log('');
}

async function main() {
  const args = process.argv.slice(2);
  let ageFilter = null;
  let playerName = null;
  let testAge = 22;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--age' && args[i + 1]) {
      ageFilter = parseInt(args[i + 1], 10);
      testAge = ageFilter;
      i++;
    } else if (args[i] === '--player' && args[i + 1]) {
      playerName = args[i + 1];
      i++;
    }
  }

  try {
    // Step 1: Check data availability
    const hasData = await checkDataAvailability();
    if (!hasData) {
      console.log('❌ No data available. Please run historical ETL first:\n');
      console.log('   npm run etl:historical -- --season 2024\n');
      await pool.end();
      process.exit(1);
    }

    // Step 2: Check clustering results
    const hasClusters = await checkClusteringResults(ageFilter);
    if (!hasClusters) {
      await pool.end();
      process.exit(1);
    }

    // Step 3: Test player comparison if player name provided
    if (playerName) {
      await testPlayerComparison(playerName, testAge);
    } else {
      console.log('💡 Tip: Test player comparison with:');
      console.log(`   node test-clustering.js --player "Anthony Edwards" --age 22\n`);
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Testing Complete');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();

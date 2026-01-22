/**
 * K-Means Clustering Utilities
 * Functions for clustering players by age using historical season averages
 */

// @ts-ignore - ml-kmeans is a CommonJS module, default export is the kmeans function
import kmeans from 'ml-kmeans';
import type { HistoricalSeasonAverage, SeasonAverage } from '../db/schema.js';

/**
 * Features used for clustering
 * Counting stats: points, assists, rebounds
 * Shooting percentages: fgPct, threePct, ftPct
 */
export interface PlayerFeatures {
  // Counting stats
  points: number;
  assists: number;
  rebounds: number;
  // Shooting percentages
  fgPct: number;
  threePct: number;
  ftPct: number;
}

/**
 * Player data with features for clustering
 */
export interface PlayerDataPoint {
  playerId: number;
  season: number;
  playerName: string;
  historicalSeasonAverageId: number | null; // null for current season averages
  seasonAverageId: number | null; // null for historical averages
  features: PlayerFeatures;
}

/**
 * Extract features from a historical season average
 * Returns null if required data is missing
 */
export function extractFeaturesFromHistorical(
  avg: HistoricalSeasonAverage
): PlayerFeatures | null {
  // Check for required fields (only counting stats and shooting percentages)
  if (
    avg.points === null ||
    avg.assists === null ||
    avg.rebounds === null
  ) {
    return null;
  }

  return {
    points: avg.points,
    assists: avg.assists,
    rebounds: avg.rebounds,
    fgPct: avg.fgPct ?? 0,
    threePct: avg.threePct ?? 0,
    ftPct: avg.ftPct ?? 0,
  };
}

/**
 * Extract features from a current season average
 * Returns null if required data is missing
 */
export function extractFeaturesFromCurrent(
  avg: SeasonAverage
): PlayerFeatures | null {
  // Check for required fields (only counting stats and shooting percentages)
  if (
    avg.points === null ||
    avg.assists === null ||
    avg.rebounds === null
  ) {
    return null;
  }

  return {
    points: avg.points,
    assists: avg.assists,
    rebounds: avg.rebounds,
    fgPct: avg.fgPct ?? 0,
    threePct: avg.threePct ?? 0,
    ftPct: avg.ftPct ?? 0,
  };
}

/**
 * Normalize features to [0, 1] range for better clustering
 * Separates counting stats from shooting percentages for independent normalization
 * Uses min-max normalization
 */
export function normalizeFeatures(
  features: PlayerFeatures[],
  minValues?: PlayerFeatures,
  maxValues?: PlayerFeatures
): { normalized: number[][]; mins: PlayerFeatures; maxs: PlayerFeatures } {
  if (features.length === 0) {
    throw new Error('Cannot normalize empty features array');
  }

  // Calculate min/max if not provided
  const mins: PlayerFeatures = minValues ?? {
    points: Math.min(...features.map(f => f.points)),
    assists: Math.min(...features.map(f => f.assists)),
    rebounds: Math.min(...features.map(f => f.rebounds)),
    fgPct: Math.min(...features.map(f => f.fgPct)),
    threePct: Math.min(...features.map(f => f.threePct)),
    ftPct: Math.min(...features.map(f => f.ftPct)),
  };

  const maxs: PlayerFeatures = maxValues ?? {
    points: Math.max(...features.map(f => f.points)),
    assists: Math.max(...features.map(f => f.assists)),
    rebounds: Math.max(...features.map(f => f.rebounds)),
    fgPct: Math.max(...features.map(f => f.fgPct)),
    threePct: Math.max(...features.map(f => f.threePct)),
    ftPct: Math.max(...features.map(f => f.ftPct)),
  };

  // Normalize each feature
  // Counting stats and shooting percentages are normalized separately
  const normalized = features.map(f => {
    const normalize = (val: number, min: number, max: number) => {
      const range = max - min;
      if (range === 0) return 0.5; // If all values are the same, use 0.5
      return (val - min) / range;
    };

    return [
      // Counting stats (normalized together)
      normalize(f.points, mins.points, maxs.points),
      normalize(f.assists, mins.assists, maxs.assists),
      normalize(f.rebounds, mins.rebounds, maxs.rebounds),
      // Shooting percentages (normalized separately from counting stats)
      normalize(f.fgPct, mins.fgPct, maxs.fgPct),
      normalize(f.threePct, mins.threePct, maxs.threePct),
      normalize(f.ftPct, mins.ftPct, maxs.ftPct),
    ];
  });

  return { normalized, mins, maxs };
}

/**
 * Run K-means clustering on player data
 * Returns cluster assignments (array of cluster indices)
 */
export function clusterPlayers(
  dataPoints: PlayerDataPoint[],
  k: number,
  maxIterations: number = 100
): number[] {
  if (dataPoints.length === 0) {
    return [];
  }

  if (dataPoints.length < k) {
    // If we have fewer players than clusters, assign each to its own cluster
    return dataPoints.map((_, i) => i);
  }

  // Extract and normalize features
  const features = dataPoints.map(dp => dp.features);
  const { normalized } = normalizeFeatures(features);

  // Run K-means
  const result = kmeans(normalized, k, {
    maxIterations,
    initialization: 'kmeans++',
  });

  return result.clusters;
}

/**
 * Check if a cluster needs to be split (too many players)
 * Returns true if cluster size exceeds threshold
 */
export function shouldSplitCluster(
  clusterSize: number,
  maxClusterSize: number = 25 // Reduced default from 50 for more granular clusters
): boolean {
  return clusterSize > maxClusterSize;
}

/**
 * Split a large cluster into sub-clusters recursively
 * Returns new cluster assignments for the players in the original cluster
 */
export function splitCluster(
  players: PlayerDataPoint[],
  maxClusterSize: number = 25 // Reduced default from 50 for more granular clusters
): number[] {
  if (players.length <= maxClusterSize) {
    // No need to split, all players in cluster 0
    return new Array(players.length).fill(0);
  }

  // Split into 2 clusters
  const clusters = clusterPlayers(players, 2);
  const cluster0: PlayerDataPoint[] = [];
  const cluster1: PlayerDataPoint[] = [];

  for (let i = 0; i < players.length; i++) {
    const player = players[i];
    const clusterId = clusters[i];
    if (!player || clusterId === undefined) continue;
    
    if (clusterId === 0) {
      cluster0.push(player);
    } else {
      cluster1.push(player);
    }
  }

  // Recursively split each sub-cluster if needed
  const assignments0 = splitCluster(cluster0, maxClusterSize);
  const assignments1 = splitCluster(cluster1, maxClusterSize);

  // Get max cluster ID from cluster0 to offset cluster1
  const maxCluster0 = assignments0.length > 0 ? Math.max(...assignments0) : -1;
  const offset = maxCluster0 + 1;

  // Build final assignments with proper indexing
  const finalAssignments: number[] = new Array(players.length);
  let idx0 = 0;
  let idx1 = 0;

  for (let i = 0; i < players.length; i++) {
    const clusterId = clusters[i];
    if (clusterId === undefined) {
      finalAssignments[i] = 0;
      continue;
    }
    
    if (clusterId === 0) {
      const assignment = assignments0[idx0++];
      finalAssignments[i] = assignment !== undefined ? assignment : 0;
    } else {
      const assignment = assignments1[idx1++];
      finalAssignments[i] = assignment !== undefined ? assignment + offset : offset;
    }
  }

  return finalAssignments;
}

/**
 * Process clusters with dynamic splitting
 * Returns final cluster assignments: dataPoint index -> cluster number
 */
export function processClustersWithSplitting(
  dataPoints: PlayerDataPoint[],
  initialK: number,
  maxClusterSize: number = 25 // Reduced default from 50 for more granular clusters
): Map<number, number> {
  if (dataPoints.length === 0) {
    return new Map();
  }

  // Initial clustering
  const initialAssignments = clusterPlayers(dataPoints, initialK);

  // Group players by initial cluster
  const clusters = new Map<number, { players: PlayerDataPoint[]; indices: number[] }>();
  for (let i = 0; i < dataPoints.length; i++) {
    const clusterId = initialAssignments[i];
    const dataPoint = dataPoints[i];
    if (clusterId === undefined || !dataPoint) continue;
    
    if (!clusters.has(clusterId)) {
      clusters.set(clusterId, { players: [], indices: [] });
    }
    const cluster = clusters.get(clusterId);
    if (cluster) {
      cluster.players.push(dataPoint);
      cluster.indices.push(i);
    }
  }

  // Process each cluster and split if needed
  const finalAssignments = new Map<number, number>();
  let nextClusterId = 0;

  for (const [initialClusterId, { players, indices }] of clusters.entries()) {
    if (shouldSplitCluster(players.length, maxClusterSize)) {
      // Split this cluster
      const splitAssignments = splitCluster(players, maxClusterSize);
      const maxLocalClusterId = splitAssignments.length > 0 ? Math.max(...splitAssignments) : 0;

      // Assign new cluster IDs
      for (let i = 0; i < players.length; i++) {
        const localClusterId = splitAssignments[i];
        const idx = indices[i];
        if (localClusterId !== undefined && idx !== undefined) {
          const globalClusterId = nextClusterId + localClusterId;
          finalAssignments.set(idx, globalClusterId);
        }
      }

      nextClusterId += maxLocalClusterId + 1;
    } else {
      // Keep cluster as-is
      for (const idx of indices) {
        finalAssignments.set(idx, nextClusterId);
      }
      nextClusterId++;
    }
  }

  return finalAssignments;
}

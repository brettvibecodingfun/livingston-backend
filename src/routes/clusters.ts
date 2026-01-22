import { db } from '../db/client.js';
import { playerClusters, players, seasonAverages, historicalSeasonAverages } from '../db/schema.js';
import { eq, like, sql } from 'drizzle-orm';

/**
 * GET /api/clusters?name=<playerName> - Get all clusters for a player by name
 * Returns clusters for season 2026 (interpreted from season_averages season 2025)
 */
async function handleGetClustersByName(req: any, res: any): Promise<boolean> {
  if (req.url?.startsWith('/api/clusters') && req.method === 'GET') {
    try {
      const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
      const playerNameParam = url.searchParams.get('name');

      if (!playerNameParam) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: 'Bad Request',
          message: 'name query parameter is required',
        }, null, 2));
        return true;
      }

      // Find player by name (case-insensitive partial match)
      const playerResults = await db
        .select()
        .from(players)
        .where(like(players.fullName, `%${playerNameParam}%`))
        .limit(10); // Limit to 10 results to avoid too many matches

      if (playerResults.length === 0) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: 'Not Found',
          message: `No player found matching name "${playerNameParam}"`,
        }, null, 2));
        return true;
      }

      // If multiple matches, return the first one (or could return all matches)
      const player = playerResults[0]!;
      
      // Get all clusters for this player with season = 2026
      const clusters = await db
        .select({
          id: playerClusters.id,
          age: playerClusters.age,
          clusterNumber: playerClusters.clusterNumber,
          playerId: playerClusters.playerId,
          season: playerClusters.season,
          playerName: playerClusters.playerName,
          // Include stats from either season_averages or historical_season_averages
          points: sql<number | null>`COALESCE(${seasonAverages.points}, ${historicalSeasonAverages.points})`,
          assists: sql<number | null>`COALESCE(${seasonAverages.assists}, ${historicalSeasonAverages.assists})`,
          rebounds: sql<number | null>`COALESCE(${seasonAverages.rebounds}, ${historicalSeasonAverages.rebounds})`,
          fgPct: sql<number | null>`COALESCE(${seasonAverages.fgPct}, ${historicalSeasonAverages.fgPct})`,
          threePct: sql<number | null>`COALESCE(${seasonAverages.threePct}, ${historicalSeasonAverages.threePct})`,
          ftPct: sql<number | null>`COALESCE(${seasonAverages.ftPct}, ${historicalSeasonAverages.ftPct})`,
          gamesPlayed: sql<number | null>`COALESCE(${seasonAverages.gamesPlayed}, ${historicalSeasonAverages.gamesPlayed})`,
          minutes: sql<number | null>`COALESCE(${seasonAverages.minutes}, ${historicalSeasonAverages.minutes})`,
          historicalSeasonAverageId: playerClusters.historicalSeasonAverageId,
          seasonAverageId: playerClusters.seasonAverageId,
          createdAt: playerClusters.createdAt,
        })
        .from(playerClusters)
        .leftJoin(seasonAverages, eq(playerClusters.seasonAverageId, seasonAverages.id))
        .leftJoin(historicalSeasonAverages, eq(playerClusters.historicalSeasonAverageId, historicalSeasonAverages.id))
        .where(
          sql`${playerClusters.playerId} = ${player.id} AND ${playerClusters.season} = 2026`
        )
        .orderBy(playerClusters.age);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        player: {
          id: player.id,
          fullName: player.fullName,
          position: player.position,
          teamId: player.teamId,
        },
        season: 2026,
        count: clusters.length,
        data: clusters,
      }, null, 2));
    } catch (error) {
      console.error('Error fetching clusters by player name:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }, null, 2));
    }
    return true;
  }
  return false;
}

/**
 * Main handler for clusters routes
 * Returns true if the request was handled, false otherwise
 */
export async function handleClusters(req: any, res: any): Promise<boolean> {
  return await handleGetClustersByName(req, res);
}

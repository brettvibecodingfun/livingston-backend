/**
 * Example Queries with Drizzle Relations
 * Demonstrates how to use the relational API for joins
 */

import { db } from './client.js';
import { teams, players, games, boxScores } from './schema.js';
import { eq, desc, and, gte } from 'drizzle-orm';

// ============================================================================
// Example 1: Get team with all its players
// ============================================================================
export async function getTeamWithPlayers(teamId: number) {
  return await db.query.teams.findFirst({
    where: eq(teams.id, teamId),
    with: {
      players: true,
    },
  });
}

// ============================================================================
// Example 2: Get player with team and recent box scores
// ============================================================================
export async function getPlayerWithStats(playerId: number) {
  return await db.query.players.findFirst({
    where: eq(players.id, playerId),
    with: {
      team: true,
      boxScores: {
        limit: 10,
        orderBy: desc(boxScores.id),
        with: {
          game: {
            with: {
              homeTeam: true,
              awayTeam: true,
            },
          },
        },
      },
    },
  });
}

// ============================================================================
// Example 3: Get game with both teams and all box scores
// ============================================================================
export async function getGameWithAllStats(gameId: number) {
  return await db.query.games.findFirst({
    where: eq(games.id, gameId),
    with: {
      homeTeam: true,
      awayTeam: true,
      boxScores: {
        with: {
          player: true,
          team: true,
        },
      },
    },
  });
}

// ============================================================================
// Example 4: Get all games for a season with teams
// ============================================================================
export async function getSeasonGames(season: number) {
  return await db.query.games.findMany({
    where: eq(games.season, season),
    orderBy: desc(games.date),
    with: {
      homeTeam: true,
      awayTeam: true,
    },
  });
}

// ============================================================================
// Example 5: Get box scores for a player in a specific season
// ============================================================================
export async function getPlayerSeasonStats(playerId: number, season: number) {
  // Note: Filtering on nested relations requires a different approach
  // Get box scores first, then filter in application code or use raw SQL
  const allBoxScores = await db.query.boxScores.findMany({
    where: eq(boxScores.playerId, playerId),
    with: {
      game: {
        with: {
          homeTeam: true,
          awayTeam: true,
        },
      },
      player: true,
      team: true,
    },
  });
  
  // Filter by season in application code
  return allBoxScores.filter(bs => bs.game.season === season);
}

// ============================================================================
// Example 6: Raw SQL query using the core API
// ============================================================================
export async function getTopScorersInGame(gameId: number, limit = 10) {
  return await db
    .select()
    .from(boxScores)
    .innerJoin(players, eq(boxScores.playerId, players.id))
    .innerJoin(teams, eq(boxScores.teamId, teams.id))
    .where(eq(boxScores.gameId, gameId))
    .orderBy(desc(boxScores.points))
    .limit(limit);
}

// ============================================================================
// Example 7: Get players by position with their teams
// ============================================================================
export async function getPlayersByPosition(position: string) {
  return await db.query.players.findMany({
    where: eq(players.position, position),
    with: {
      team: true,
    },
    orderBy: desc(players.firstName),
  });
}

// ============================================================================
// Example 8: Complex aggregation - Team season stats
// ============================================================================
export async function getTeamSeasonRecord(teamId: number, season: number) {
  // Get all games where team played (home or away)
  const homeGames = await db.query.games.findMany({
    where: and(eq(games.homeTeamId, teamId), eq(games.season, season)),
    with: {
      homeTeam: true,
      awayTeam: true,
    },
  });

  const awayGames = await db.query.games.findMany({
    where: and(eq(games.awayTeamId, teamId), eq(games.season, season)),
    with: {
      homeTeam: true,
      awayTeam: true,
    },
  });

  return {
    homeGames,
    awayGames,
    totalGames: homeGames.length + awayGames.length,
  };
}


import { db } from '../db/client.js';
import { teams, players, games, boxScores, leaders, standings, seasonAverages } from '../db/schema.js';
import type { NewTeam, NewPlayer, NewGame, NewBoxScore, NewLeader, NewStanding, NewSeasonAverage } from '../db/schema.js';
import { eq, sql, inArray, and } from 'drizzle-orm';

/**
 * Upsert a team by api_id
 * ON CONFLICT (api_id) DO UPDATE
 * Returns the local database id
 */
export async function upsertTeam(row: NewTeam): Promise<number> {
  const result = await db
    .insert(teams)
    .values(row)
    .onConflictDoUpdate({
      target: teams.apiId,
      set: {
        name: sql`EXCLUDED.name`,
        abbreviation: sql`EXCLUDED.abbreviation`,
        city: sql`EXCLUDED.city`,
        conference: sql`EXCLUDED.conference`,
        division: sql`EXCLUDED.division`,
      },
    })
    .returning({ id: teams.id });

  return result[0]!.id;
}

/**
 * Upsert a player by api_id
 * ON CONFLICT (api_id) DO UPDATE
 * Returns the local database id
 */
export async function upsertPlayer(row: NewPlayer): Promise<number> {
  const result = await db
    .insert(players)
    .values(row)
    .onConflictDoUpdate({
      target: players.apiId,
      set: {
        fullName: sql`EXCLUDED.full_name`,
        firstName: sql`EXCLUDED.first_name`,
        lastName: sql`EXCLUDED.last_name`,
        teamId: sql`EXCLUDED.team_id`,
        position: sql`EXCLUDED.position`,
        height: sql`EXCLUDED.height`,
        weight: sql`EXCLUDED.weight`,
        college: sql`EXCLUDED.college`,
        country: sql`EXCLUDED.country`,
        draftYear: sql`EXCLUDED.draft_year`,
        birthdate: sql`EXCLUDED.birthdate`,
        age: sql`EXCLUDED.age`,
      },
    })
    .returning({ id: players.id });

  return result[0]!.id;
}

/**
 * Upsert a game by api_id
 * ON CONFLICT (api_id) DO UPDATE
 * Returns the local database id
 */
export async function upsertGame(row: NewGame): Promise<number> {
  const result = await db
    .insert(games)
    .values(row)
    .onConflictDoUpdate({
      target: games.apiId,
      set: {
        season: sql`EXCLUDED.season`,
        date: sql`EXCLUDED.date`,
        homeTeamId: sql`EXCLUDED.home_team_id`,
        awayTeamId: sql`EXCLUDED.away_team_id`,
        homeScore: sql`EXCLUDED.home_score`,
        awayScore: sql`EXCLUDED.away_score`,
      },
    })
    .returning({ id: games.id });

  return result[0]!.id;
}

/**
 * Upsert a box score by (game_id, player_id)
 * ON CONFLICT (game_id, player_id) DO UPDATE
 * Returns the local database id
 */
export async function upsertBoxScore(row: NewBoxScore): Promise<number> {
  const result = await db
    .insert(boxScores)
    .values(row)
    .onConflictDoUpdate({
      target: [boxScores.gameId, boxScores.playerId],
      set: {
        teamId: sql`EXCLUDED.team_id`,
        minutes: sql`EXCLUDED.minutes`,
        points: sql`EXCLUDED.points`,
        assists: sql`EXCLUDED.assists`,
        rebounds: sql`EXCLUDED.rebounds`,
        steals: sql`EXCLUDED.steals`,
        blocks: sql`EXCLUDED.blocks`,
        turnovers: sql`EXCLUDED.turnovers`,
        fgm: sql`EXCLUDED.fgm`,
        fga: sql`EXCLUDED.fga`,
        tpm: sql`EXCLUDED.tpm`,
        tpa: sql`EXCLUDED.tpa`,
        ftm: sql`EXCLUDED.ftm`,
        fta: sql`EXCLUDED.fta`,
      },
    })
    .returning({ id: boxScores.id });

  return result[0]!.id;
}

/**
 * Upsert a leader by (player_id, season, stat_type)
 * ON CONFLICT (player_id, season, stat_type) DO UPDATE
 * Returns the local database id
 */
export async function upsertLeader(row: NewLeader): Promise<number> {
  const result = await db
    .insert(leaders)
    .values(row)
    .onConflictDoUpdate({
      target: [leaders.playerId, leaders.season, leaders.statType],
      set: {
        value: sql`EXCLUDED.value`,
        rank: sql`EXCLUDED.rank`,
        gamesPlayed: sql`EXCLUDED.games_played`,
      },
    })
    .returning({ id: leaders.id });

  return result[0]!.id;
}

/**
 * Upsert team standings by (team_id, season)
 */
export async function upsertStanding(row: NewStanding): Promise<number> {
  return await db.transaction(async (tx) => {
    await tx
      .delete(standings)
      .where(and(eq(standings.teamId, row.teamId), eq(standings.season, row.season)));

    const result = await tx
      .insert(standings)
      .values(row)
      .returning({ id: standings.id });

    return result[0]!.id;
  });
}

/**
 * Upsert season averages by (player_id, season)
 */
export async function upsertSeasonAverage(row: NewSeasonAverage): Promise<number> {
  return await db.transaction(async (tx) => {
    await tx
      .delete(seasonAverages)
      .where(and(eq(seasonAverages.playerId, row.playerId), eq(seasonAverages.season, row.season)));

    const result = await tx
      .insert(seasonAverages)
      .values(row)
      .returning({ id: seasonAverages.id });

    return result[0]!.id;
  });
}

// ============================================================================
// Helper Functions for FK Resolution
// ============================================================================

/**
 * Get team database id by api_id
 */
export async function getTeamIdByApiId(apiId: number): Promise<number | null> {
  const result = await db
    .select({ id: teams.id })
    .from(teams)
    .where(eq(teams.apiId, apiId))
    .limit(1);

  return result[0]?.id ?? null;
}

/**
 * Get player database id by api_id
 */
export async function getPlayerIdByApiId(apiId: number): Promise<number | null> {
  const result = await db
    .select({ id: players.id })
    .from(players)
    .where(eq(players.apiId, apiId))
    .limit(1);

  return result[0]?.id ?? null;
}

/**
 * Get game database id by api_id
 */
export async function getGameIdByApiId(apiId: number): Promise<number | null> {
  const result = await db
    .select({ id: games.id })
    .from(games)
    .where(eq(games.apiId, apiId))
    .limit(1);

  return result[0]?.id ?? null;
}

/**
 * Build a map of api_id -> database id for teams
 */
export async function buildTeamIdMap(apiIds: number[]): Promise<Map<number, number>> {
  if (apiIds.length === 0) return new Map();

  const results = await db
    .select({ apiId: teams.apiId, id: teams.id })
    .from(teams)
    .where(inArray(teams.apiId, apiIds));

  const map = new Map<number, number>();
  results.forEach(row => map.set(row.apiId, row.id));
  return map;
}

/**
 * Build a map of api_id -> database id for players
 */
export async function buildPlayerIdMap(apiIds: number[]): Promise<Map<number, number>> {
  if (apiIds.length === 0) return new Map();

  const results = await db
    .select({ apiId: players.apiId, id: players.id })
    .from(players)
    .where(inArray(players.apiId, apiIds));

  const map = new Map<number, number>();
  results.forEach(row => map.set(row.apiId, row.id));
  return map;
}

/**
 * Build a map of api_id -> database id for games
 */
export async function buildGameIdMap(apiIds: number[]): Promise<Map<number, number>> {
  if (apiIds.length === 0) return new Map();

  const results = await db
    .select({ apiId: games.apiId, id: games.id })
    .from(games)
    .where(inArray(games.apiId, apiIds));

  const map = new Map<number, number>();
  results.forEach(row => map.set(row.apiId, row.id));
  return map;
}

import { db } from '../db/client.js';
import { teams, players, games, boxScores, leaders, standings, seasonAverages, clutchSeasonAverages } from '../db/schema.js';
import type { NewTeam, NewPlayer, NewGame, NewBoxScore, NewLeader, NewStanding, NewSeasonAverage, NewClutchSeasonAverage } from '../db/schema.js';
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
        baseSalary: sql`EXCLUDED.base_salary`,
      },
    })
    .returning({ id: players.id });

  return result[0]!.id;
}

/**
 * Update player base salary from contract data
 */
export async function updatePlayerBaseSalary(playerApiId: number, baseSalary: number | null): Promise<void> {
  await db
    .update(players)
    .set({ baseSalary: baseSalary })
    .where(eq(players.apiId, playerApiId));
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
 * Uses ON CONFLICT DO UPDATE to merge fields, preserving existing values when new values are null
 * This allows us to update base stats and advanced stats separately without overwriting each other
 */
export async function upsertSeasonAverage(row: NewSeasonAverage): Promise<number> {
  const result = await db
    .insert(seasonAverages)
    .values(row)
    .onConflictDoUpdate({
      target: [seasonAverages.playerId, seasonAverages.season],
      set: {
        // Base stats - use COALESCE to preserve existing value if new value is null
        gamesPlayed: sql`COALESCE(EXCLUDED.games_played, season_averages.games_played)`,
        minutes: sql`COALESCE(EXCLUDED.minutes, season_averages.minutes)`,
        points: sql`COALESCE(EXCLUDED.points, season_averages.points)`,
        assists: sql`COALESCE(EXCLUDED.assists, season_averages.assists)`,
        rebounds: sql`COALESCE(EXCLUDED.rebounds, season_averages.rebounds)`,
        steals: sql`COALESCE(EXCLUDED.steals, season_averages.steals)`,
        blocks: sql`COALESCE(EXCLUDED.blocks, season_averages.blocks)`,
        turnovers: sql`COALESCE(EXCLUDED.turnovers, season_averages.turnovers)`,
        fgm: sql`COALESCE(EXCLUDED.fgm, season_averages.fgm)`,
        fga: sql`COALESCE(EXCLUDED.fga, season_averages.fga)`,
        fgPct: sql`COALESCE(EXCLUDED.fg_pct, season_averages.fg_pct)`,
        tpm: sql`COALESCE(EXCLUDED.tpm, season_averages.tpm)`,
        tpa: sql`COALESCE(EXCLUDED.tpa, season_averages.tpa)`,
        threePct: sql`COALESCE(EXCLUDED.three_pct, season_averages.three_pct)`,
        ftm: sql`COALESCE(EXCLUDED.ftm, season_averages.ftm)`,
        fta: sql`COALESCE(EXCLUDED.fta, season_averages.fta)`,
        ftPct: sql`COALESCE(EXCLUDED.ft_pct, season_averages.ft_pct)`,
        // Advanced stats - use COALESCE to preserve existing value if new value is null
        losses: sql`COALESCE(EXCLUDED.losses, season_averages.losses)`,
        wins: sql`COALESCE(EXCLUDED.wins, season_averages.wins)`,
        age: sql`COALESCE(EXCLUDED.age, season_averages.age)`,
        pie: sql`COALESCE(EXCLUDED.pie, season_averages.pie)`,
        pace: sql`COALESCE(EXCLUDED.pace, season_averages.pace)`,
        possessions: sql`COALESCE(EXCLUDED.possessions, season_averages.possessions)`,
        winPct: sql`COALESCE(EXCLUDED.win_pct, season_averages.win_pct)`,
        astTo: sql`COALESCE(EXCLUDED.ast_to, season_averages.ast_to)`,
        ePace: sql`COALESCE(EXCLUDED.e_pace, season_averages.e_pace)`,
        fgaPg: sql`COALESCE(EXCLUDED.fga_pg, season_averages.fga_pg)`,
        fgmPg: sql`COALESCE(EXCLUDED.fgm_pg, season_averages.fgm_pg)`,
        tsPct: sql`COALESCE(EXCLUDED.ts_pct, season_averages.ts_pct)`,
        astPct: sql`COALESCE(EXCLUDED.ast_pct, season_averages.ast_pct)`,
        efgPct: sql`COALESCE(EXCLUDED.efg_pct, season_averages.efg_pct)`,
        rebPct: sql`COALESCE(EXCLUDED.reb_pct, season_averages.reb_pct)`,
        usgPct: sql`COALESCE(EXCLUDED.usg_pct, season_averages.usg_pct)`,
        drebPct: sql`COALESCE(EXCLUDED.dreb_pct, season_averages.dreb_pct)`,
        orebPct: sql`COALESCE(EXCLUDED.oreb_pct, season_averages.oreb_pct)`,
        astRatio: sql`COALESCE(EXCLUDED.ast_ratio, season_averages.ast_ratio)`,
        eTovPct: sql`COALESCE(EXCLUDED.e_tov_pct, season_averages.e_tov_pct)`,
        eUsgPct: sql`COALESCE(EXCLUDED.e_usg_pct, season_averages.e_usg_pct)`,
        defRating: sql`COALESCE(EXCLUDED.def_rating, season_averages.def_rating)`,
        netRating: sql`COALESCE(EXCLUDED.net_rating, season_averages.net_rating)`,
        offRating: sql`COALESCE(EXCLUDED.off_rating, season_averages.off_rating)`,
        pacePer40: sql`COALESCE(EXCLUDED.pace_per40, season_averages.pace_per40)`,
        teamCount: sql`COALESCE(EXCLUDED.team_count, season_averages.team_count)`,
        tmTovPct: sql`COALESCE(EXCLUDED.tm_tov_pct, season_averages.tm_tov_pct)`,
        eDefRating: sql`COALESCE(EXCLUDED.e_def_rating, season_averages.e_def_rating)`,
        eNetRating: sql`COALESCE(EXCLUDED.e_net_rating, season_averages.e_net_rating)`,
        eOffRating: sql`COALESCE(EXCLUDED.e_off_rating, season_averages.e_off_rating)`,
        spWorkPace: sql`COALESCE(EXCLUDED.sp_work_pace, season_averages.sp_work_pace)`,
        spWorkDefRating: sql`COALESCE(EXCLUDED.sp_work_def_rating, season_averages.sp_work_def_rating)`,
        spWorkNetRating: sql`COALESCE(EXCLUDED.sp_work_net_rating, season_averages.sp_work_net_rating)`,
        spWorkOffRating: sql`COALESCE(EXCLUDED.sp_work_off_rating, season_averages.sp_work_off_rating)`,
      },
    })
    .returning({ id: seasonAverages.id });

  return result[0]!.id;
}

/**
 * Upsert clutch season averages by (player_id, season)
 * Uses ON CONFLICT DO UPDATE to merge fields, preserving existing values when new values are null
 * This allows us to update base stats and advanced stats separately without overwriting each other
 */
export async function upsertClutchSeasonAverage(row: NewClutchSeasonAverage): Promise<number> {
  const result = await db
    .insert(clutchSeasonAverages)
    .values(row)
    .onConflictDoUpdate({
      target: [clutchSeasonAverages.playerId, clutchSeasonAverages.season],
      set: {
        // Base stats - use COALESCE to preserve existing value if new value is null
        gamesPlayed: sql`COALESCE(EXCLUDED.games_played, clutch_season_averages.games_played)`,
        minutes: sql`COALESCE(EXCLUDED.minutes, clutch_season_averages.minutes)`,
        points: sql`COALESCE(EXCLUDED.points, clutch_season_averages.points)`,
        assists: sql`COALESCE(EXCLUDED.assists, clutch_season_averages.assists)`,
        rebounds: sql`COALESCE(EXCLUDED.rebounds, clutch_season_averages.rebounds)`,
        steals: sql`COALESCE(EXCLUDED.steals, clutch_season_averages.steals)`,
        blocks: sql`COALESCE(EXCLUDED.blocks, clutch_season_averages.blocks)`,
        turnovers: sql`COALESCE(EXCLUDED.turnovers, clutch_season_averages.turnovers)`,
        fgm: sql`COALESCE(EXCLUDED.fgm, clutch_season_averages.fgm)`,
        fga: sql`COALESCE(EXCLUDED.fga, clutch_season_averages.fga)`,
        fgPct: sql`COALESCE(EXCLUDED.fg_pct, clutch_season_averages.fg_pct)`,
        tpm: sql`COALESCE(EXCLUDED.tpm, clutch_season_averages.tpm)`,
        tpa: sql`COALESCE(EXCLUDED.tpa, clutch_season_averages.tpa)`,
        threePct: sql`COALESCE(EXCLUDED.three_pct, clutch_season_averages.three_pct)`,
        ftm: sql`COALESCE(EXCLUDED.ftm, clutch_season_averages.ftm)`,
        fta: sql`COALESCE(EXCLUDED.fta, clutch_season_averages.fta)`,
        ftPct: sql`COALESCE(EXCLUDED.ft_pct, clutch_season_averages.ft_pct)`,
        // Advanced stats - use COALESCE to preserve existing value if new value is null
        losses: sql`COALESCE(EXCLUDED.losses, clutch_season_averages.losses)`,
        wins: sql`COALESCE(EXCLUDED.wins, clutch_season_averages.wins)`,
        age: sql`COALESCE(EXCLUDED.age, clutch_season_averages.age)`,
        pie: sql`COALESCE(EXCLUDED.pie, clutch_season_averages.pie)`,
        pace: sql`COALESCE(EXCLUDED.pace, clutch_season_averages.pace)`,
        possessions: sql`COALESCE(EXCLUDED.possessions, clutch_season_averages.possessions)`,
        winPct: sql`COALESCE(EXCLUDED.win_pct, clutch_season_averages.win_pct)`,
        astTo: sql`COALESCE(EXCLUDED.ast_to, clutch_season_averages.ast_to)`,
        ePace: sql`COALESCE(EXCLUDED.e_pace, clutch_season_averages.e_pace)`,
        fgaPg: sql`COALESCE(EXCLUDED.fga_pg, clutch_season_averages.fga_pg)`,
        fgmPg: sql`COALESCE(EXCLUDED.fgm_pg, clutch_season_averages.fgm_pg)`,
        tsPct: sql`COALESCE(EXCLUDED.ts_pct, clutch_season_averages.ts_pct)`,
        astPct: sql`COALESCE(EXCLUDED.ast_pct, clutch_season_averages.ast_pct)`,
        efgPct: sql`COALESCE(EXCLUDED.efg_pct, clutch_season_averages.efg_pct)`,
        rebPct: sql`COALESCE(EXCLUDED.reb_pct, clutch_season_averages.reb_pct)`,
        usgPct: sql`COALESCE(EXCLUDED.usg_pct, clutch_season_averages.usg_pct)`,
        drebPct: sql`COALESCE(EXCLUDED.dreb_pct, clutch_season_averages.dreb_pct)`,
        orebPct: sql`COALESCE(EXCLUDED.oreb_pct, clutch_season_averages.oreb_pct)`,
        astRatio: sql`COALESCE(EXCLUDED.ast_ratio, clutch_season_averages.ast_ratio)`,
        eTovPct: sql`COALESCE(EXCLUDED.e_tov_pct, clutch_season_averages.e_tov_pct)`,
        eUsgPct: sql`COALESCE(EXCLUDED.e_usg_pct, clutch_season_averages.e_usg_pct)`,
        defRating: sql`COALESCE(EXCLUDED.def_rating, clutch_season_averages.def_rating)`,
        netRating: sql`COALESCE(EXCLUDED.net_rating, clutch_season_averages.net_rating)`,
        offRating: sql`COALESCE(EXCLUDED.off_rating, clutch_season_averages.off_rating)`,
        pacePer40: sql`COALESCE(EXCLUDED.pace_per40, clutch_season_averages.pace_per40)`,
        teamCount: sql`COALESCE(EXCLUDED.team_count, clutch_season_averages.team_count)`,
        tmTovPct: sql`COALESCE(EXCLUDED.tm_tov_pct, clutch_season_averages.tm_tov_pct)`,
        eDefRating: sql`COALESCE(EXCLUDED.e_def_rating, clutch_season_averages.e_def_rating)`,
        eNetRating: sql`COALESCE(EXCLUDED.e_net_rating, clutch_season_averages.e_net_rating)`,
        eOffRating: sql`COALESCE(EXCLUDED.e_off_rating, clutch_season_averages.e_off_rating)`,
        spWorkPace: sql`COALESCE(EXCLUDED.sp_work_pace, clutch_season_averages.sp_work_pace)`,
        spWorkDefRating: sql`COALESCE(EXCLUDED.sp_work_def_rating, clutch_season_averages.sp_work_def_rating)`,
        spWorkNetRating: sql`COALESCE(EXCLUDED.sp_work_net_rating, clutch_season_averages.sp_work_net_rating)`,
        spWorkOffRating: sql`COALESCE(EXCLUDED.sp_work_off_rating, clutch_season_averages.sp_work_off_rating)`,
      },
    })
    .returning({ id: clutchSeasonAverages.id });

  return result[0]!.id;
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

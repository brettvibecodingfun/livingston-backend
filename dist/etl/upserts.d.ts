import type { NewTeam, NewPlayer, NewGame, NewBoxScore, NewLeader, NewStanding, NewSeasonAverage, NewClutchSeasonAverage, NewHistoricalSeasonAverage, NewTeamSeasonAverage } from '../db/schema.js';
/**
 * Upsert a team by api_id
 * ON CONFLICT (api_id) DO UPDATE
 * Returns the local database id
 */
export declare function upsertTeam(row: NewTeam): Promise<number>;
/**
 * Upsert a player by api_id
 * ON CONFLICT (api_id) DO UPDATE
 * Returns the local database id
 */
export declare function upsertPlayer(row: NewPlayer): Promise<number>;
/**
 * Update player base salary from contract data
 */
export declare function updatePlayerBaseSalary(playerApiId: number, baseSalary: number | null): Promise<void>;
/**
 * Upsert a game by api_id
 * ON CONFLICT (api_id) DO UPDATE
 * Returns the local database id
 */
export declare function upsertGame(row: NewGame): Promise<number>;
/**
 * Upsert a box score by (game_id, player_id)
 * ON CONFLICT (game_id, player_id) DO UPDATE
 * Returns the local database id
 */
export declare function upsertBoxScore(row: NewBoxScore): Promise<number>;
/**
 * Upsert a leader by (player_id, season, stat_type)
 * ON CONFLICT (player_id, season, stat_type) DO UPDATE
 * Returns the local database id
 */
export declare function upsertLeader(row: NewLeader): Promise<number>;
/**
 * Upsert team standings by (team_id, season)
 */
export declare function upsertStanding(row: NewStanding): Promise<number>;
/**
 * Upsert season averages by (player_id, season)
 * Uses ON CONFLICT DO UPDATE to merge fields, preserving existing values when new values are null
 * This allows us to update base stats and advanced stats separately without overwriting each other
 */
export declare function upsertSeasonAverage(row: NewSeasonAverage): Promise<number>;
/**
 * Upsert clutch season averages by (player_id, season)
 * Uses ON CONFLICT DO UPDATE to merge fields, preserving existing values when new values are null
 * This allows us to update base stats and advanced stats separately without overwriting each other
 */
export declare function upsertClutchSeasonAverage(row: NewClutchSeasonAverage): Promise<number>;
/**
 * Get team database id by api_id
 */
export declare function getTeamIdByApiId(apiId: number): Promise<number | null>;
/**
 * Get player database id by api_id
 */
export declare function getPlayerIdByApiId(apiId: number): Promise<number | null>;
/**
 * Get game database id by api_id
 */
export declare function getGameIdByApiId(apiId: number): Promise<number | null>;
/**
 * Build a map of api_id -> database id for teams
 */
export declare function buildTeamIdMap(apiIds: number[]): Promise<Map<number, number>>;
/**
 * Build a map of api_id -> database id for players
 */
export declare function buildPlayerIdMap(apiIds: number[]): Promise<Map<number, number>>;
/**
 * Build a map of api_id -> database id for games
 */
export declare function buildGameIdMap(apiIds: number[]): Promise<Map<number, number>>;
/**
 * Upsert a historical season average by playerId and season
 * ON CONFLICT (player_id, season) DO UPDATE
 * Uses COALESCE to preserve existing values if new value is null
 * Returns the local database id
 */
export declare function upsertHistoricalSeasonAverage(row: NewHistoricalSeasonAverage): Promise<number>;
/**
 * Upsert a team season average by teamId, season, and seasonType
 * ON CONFLICT (teamId, season, seasonType) DO UPDATE
 * Uses COALESCE to preserve existing values if new value is null
 * Returns the local database id
 */
export declare function upsertTeamSeasonAverage(row: NewTeamSeasonAverage): Promise<number>;
//# sourceMappingURL=upserts.d.ts.map
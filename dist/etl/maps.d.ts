import type { ApiTeam, ApiPlayer, ApiGame, ApiBoxScore, ApiLeader, ApiStanding } from './providers/balldontlie.js';
import type { NewTeam, NewPlayer, NewGame, NewBoxScore, NewLeader, NewStanding } from '../db/schema.js';
/**
 * Map API team to DB team shape
 */
export declare function mapTeamToDb(apiTeam: ApiTeam): NewTeam;
/**
 * Map API player to DB player shape
 * Note: teamId will be resolved separately via team api_id lookup
 */
export declare function mapPlayerToDb(apiPlayer: ApiPlayer, teamId: number | null): NewPlayer;
/**
 * Map API game to DB game shape
 * Note: homeTeamId and awayTeamId will be resolved via team api_id lookup
 */
export declare function mapGameToDb(apiGame: ApiGame, homeTeamId: number, awayTeamId: number): NewGame;
/**
 * Map API box score to DB box score shape
 * Note: gameId, playerId, and teamId will be resolved via api_id lookup
 *
 * Normalizes stats:
 * - Combines oreb + dreb into rebounds
 * - Maps fg3m/fg3a to tpm/tpa
 * - Converts minutes string to decimal number
 */
export declare function mapBoxScoreToDb(apiBoxScore: ApiBoxScore, gameId: number, playerId: number, teamId: number): NewBoxScore;
/**
 * Map API leader to DB leader shape
 * Note: playerId will be resolved via player api_id lookup
 */
export declare function mapLeaderToDb(apiLeader: ApiLeader, playerId: number): NewLeader;
export declare function mapStandingToDb(apiStanding: ApiStanding, teamId: number): NewStanding;
//# sourceMappingURL=maps.d.ts.map
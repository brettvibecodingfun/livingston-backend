import type { ApiTeam, ApiPlayer, ApiGame, ApiBoxScore, ApiLeader, ApiStanding, ApiSeasonAverage, ApiAdvancedSeasonAverage } from './providers/balldontlie.js';
import type { NewTeam, NewPlayer, NewGame, NewBoxScore, NewLeader, NewStanding, NewSeasonAverage, NewHistoricalSeasonAverage } from '../db/schema.js';
import { parseMinutes } from './providers/balldontlie.js';
import { getPlayerBirthdate, calculateAge } from './constants/player-birthdates.js';

/**
 * Map API team to DB team shape
 */
export function mapTeamToDb(apiTeam: ApiTeam): NewTeam {
  return {
    apiId: apiTeam.id,
    name: apiTeam.name,
    abbreviation: apiTeam.abbreviation,
    city: apiTeam.city,
    conference: apiTeam.conference,
    division: apiTeam.division,
  };
}

/**
 * Map API player to DB player shape
 * Note: teamId will be resolved separately via team api_id lookup
 * Age is calculated from birthdate constants
 */
export function mapPlayerToDb(apiPlayer: ApiPlayer, teamId: number | null): NewPlayer {
  // Get birthdate from constants
  const birthdateRaw = getPlayerBirthdate(apiPlayer.id);
  // Extract just the date part (YYYY-MM-DD) if it includes timestamp
  const birthdate = birthdateRaw ? (birthdateRaw.split('T')[0] || birthdateRaw.split(' ')[0] || birthdateRaw) : null;
  // Calculate age from birthdate
  const age = calculateAge(birthdateRaw);
  
  return {
    apiId: apiPlayer.id,
    fullName: `${apiPlayer.first_name} ${apiPlayer.last_name}`,
    firstName: apiPlayer.first_name,
    lastName: apiPlayer.last_name,
    teamId: teamId,
    position: apiPlayer.position,
    height: apiPlayer.height,
    weight: apiPlayer.weight,
    college: apiPlayer.college ?? null,
    country: apiPlayer.country ?? null,
    draftYear: apiPlayer.draft_year ?? null,
    birthdate: birthdate,
    age: age,
  };
}

/**
 * Map API game to DB game shape
 * Note: homeTeamId and awayTeamId will be resolved via team api_id lookup
 */
export function mapGameToDb(
  apiGame: ApiGame,
  homeTeamId: number,
  awayTeamId: number
): NewGame {
  return {
    apiId: apiGame.id,
    season: apiGame.season,
    date: apiGame.date,
    homeTeamId: homeTeamId,
    awayTeamId: awayTeamId,
    homeScore: apiGame.home_team_score,
    awayScore: apiGame.visitor_team_score,
  };
}

/**
 * Map API box score to DB box score shape
 * Note: gameId, playerId, and teamId will be resolved via api_id lookup
 * 
 * Normalizes stats:
 * - Combines oreb + dreb into rebounds
 * - Maps fg3m/fg3a to tpm/tpa
 * - Converts minutes string to decimal number
 */
export function mapBoxScoreToDb(
  apiBoxScore: ApiBoxScore,
  gameId: number,
  playerId: number,
  teamId: number
): NewBoxScore {
  // Parse minutes from "MM:SS" to decimal
  let minutes: number | null = null;
  if (apiBoxScore.min) {
    const parts = apiBoxScore.min.split(':');
    if (parts.length === 2) {
      const mins = parseInt(parts[0] || '0', 10);
      const secs = parseInt(parts[1] || '0', 10);
      minutes = mins + (secs / 60);
    }
  }

  // Combine offensive and defensive rebounds
  const rebounds = (apiBoxScore.oreb || 0) + (apiBoxScore.dreb || 0);

  return {
    gameId: gameId,
    playerId: playerId,
    teamId: teamId,
    minutes: minutes,
    points: apiBoxScore.pts,
    assists: apiBoxScore.ast,
    rebounds: rebounds > 0 ? rebounds : null,
    steals: apiBoxScore.stl,
    blocks: apiBoxScore.blk,
    turnovers: apiBoxScore.turnover,
    fgm: apiBoxScore.fgm,
    fga: apiBoxScore.fga,
    tpm: apiBoxScore.fg3m, // three-pointers made
    tpa: apiBoxScore.fg3a, // three-pointers attempted
    ftm: apiBoxScore.ftm,
    fta: apiBoxScore.fta,
  };
}

/**
 * Map API leader to DB leader shape
 * Note: playerId will be resolved via player api_id lookup
 */
export function mapLeaderToDb(
  apiLeader: ApiLeader,
  playerId: number
): NewLeader {
  return {
    playerId: playerId,
    season: apiLeader.season,
    statType: apiLeader.stat_type,
    value: apiLeader.value,
    rank: apiLeader.rank,
    gamesPlayed: apiLeader.games_played,
  };
}

export function mapStandingToDb(apiStanding: ApiStanding, teamId: number): NewStanding {
  return {
    teamId,
    season: apiStanding.season,
    wins: apiStanding.wins,
    losses: apiStanding.losses,
    conferenceRank: apiStanding.conference_rank ?? null,
    divisionRank: apiStanding.division_rank ?? null,
    conferenceRecord: apiStanding.conference_record ?? null,
    divisionRecord: apiStanding.division_record ?? null,
    homeRecord: apiStanding.home_record ?? null,
    roadRecord: apiStanding.road_record ?? null,
  };
}

/**
 * Map API season average to DB season average shape
 * Note: playerId will be resolved via player api_id lookup
 * API response has nested structure: player.id and stats object
 */
export function mapSeasonAverageToDb(
  apiSeasonAverage: ApiSeasonAverage | ApiAdvancedSeasonAverage, 
  playerId: number
): NewSeasonAverage {
  const stats = apiSeasonAverage.stats || {};
  const advancedStats = stats as any; // Type assertion to access advanced stats fields
  
  return {
    playerId,
    season: apiSeasonAverage.season,
    gamesPlayed: stats.gp ?? null,
    minutes: stats.min ?? null, // Already a number, not a string
    points: stats.pts ?? null,
    assists: stats.ast ?? null,
    rebounds: stats.reb ?? null,
    steals: stats.stl ?? null,
    blocks: stats.blk ?? null,
    turnovers: stats.tov ?? null,
    fgm: stats.fgm ?? null,
    fga: stats.fga ?? null,
    fgPct: stats.fg_pct ?? null,
    tpm: stats.fg3m ?? null,
    tpa: stats.fg3a ?? null,
    threePct: stats.fg3_pct ?? null,
    ftm: stats.ftm ?? null,
    fta: stats.fta ?? null,
    ftPct: stats.ft_pct ?? null,
    // Advanced stats fields (will be null if not present in ApiSeasonAverage)
    losses: advancedStats.l ?? null,
    wins: advancedStats.w ?? null,
    age: advancedStats.age ?? null,
    pie: advancedStats.pie ?? null,
    pace: advancedStats.pace ?? null,
    possessions: advancedStats.poss ?? null,
    winPct: advancedStats.w_pct ?? null,
    astTo: advancedStats.ast_to ?? null,
    ePace: advancedStats.e_pace ?? null,
    fgaPg: advancedStats.fga_pg ?? null,
    fgmPg: advancedStats.fgm_pg ?? null,
    tsPct: advancedStats.ts_pct ?? null,
    astPct: advancedStats.ast_pct ?? null,
    efgPct: advancedStats.efg_pct ?? null,
    rebPct: advancedStats.reb_pct ?? null,
    usgPct: advancedStats.usg_pct ?? null,
    drebPct: advancedStats.dreb_pct ?? null,
    orebPct: advancedStats.oreb_pct ?? null,
    astRatio: advancedStats.ast_ratio ?? null,
    eTovPct: advancedStats.e_tov_pct ?? null,
    eUsgPct: advancedStats.e_usg_pct ?? null,
    defRating: advancedStats.def_rating ?? null,
    netRating: advancedStats.net_rating ?? null,
    offRating: advancedStats.off_rating ?? null,
    pacePer40: advancedStats.pace_per40 ?? null,
    teamCount: advancedStats.team_count ?? null,
    tmTovPct: advancedStats.tm_tov_pct ?? null,
    eDefRating: advancedStats.e_def_rating ?? null,
    eNetRating: advancedStats.e_net_rating ?? null,
    eOffRating: advancedStats.e_off_rating ?? null,
    spWorkPace: advancedStats.sp_work_pace ?? null,
    spWorkDefRating: advancedStats.sp_work_def_rating ?? null,
    spWorkNetRating: advancedStats.sp_work_net_rating ?? null,
    spWorkOffRating: advancedStats.sp_work_off_rating ?? null,
  };
}

/**
 * Map API historical season average to DB historical season average shape
 * Note: playerId will be resolved via player api_id lookup
 * Season is incremented by 1 (API 2014 -> DB 2015)
 * Only includes base stats, no advanced stats or rankings
 */
export function mapHistoricalSeasonAverageToDb(
  apiSeasonAverage: ApiSeasonAverage,
  playerId: number
): NewHistoricalSeasonAverage {
  const stats = apiSeasonAverage.stats || {};
  const player = apiSeasonAverage.player || {};
  
  // Construct full player name
  const playerName = `${player.first_name || ''} ${player.last_name || ''}`.trim();
  
  return {
    playerId,
    playerName,
    season: apiSeasonAverage.season + 1, // Increment season by 1 (API 2014 -> DB 2015)
    gamesPlayed: stats.gp ?? null,
    minutes: stats.min ?? null,
    points: stats.pts ?? null,
    assists: stats.ast ?? null,
    rebounds: stats.reb ?? null,
    steals: stats.stl ?? null,
    blocks: stats.blk ?? null,
    turnovers: stats.tov ?? null,
    fgm: stats.fgm ?? null,
    fga: stats.fga ?? null,
    fgPct: stats.fg_pct ?? null,
    tpm: stats.fg3m ?? null,
    tpa: stats.fg3a ?? null,
    threePct: stats.fg3_pct ?? null,
    ftm: stats.ftm ?? null,
    fta: stats.fta ?? null,
    ftPct: stats.ft_pct ?? null,
    age: stats.age ?? null, // Age from stats (now explicitly in schema)
  };
}

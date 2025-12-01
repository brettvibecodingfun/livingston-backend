import { pgTable, serial, integer, text, date, real, unique, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

/**
 * Teams table
 * Stores NBA team information
 */
export const teams = pgTable('teams', {
  id: serial('id').primaryKey(),
  apiId: integer('api_id').notNull().unique(),
  name: text('name').notNull(),
  abbreviation: text('abbreviation').notNull(),
  city: text('city').notNull(),
  conference: text('conference').notNull(),
  division: text('division').notNull(),
}, (table) => ({
  apiIdIdx: index('teams_api_id_idx').on(table.apiId),
}));

/**
 * Players table
 * Stores NBA player information
 */
export const players = pgTable('players', {
  id: serial('id').primaryKey(),
  apiId: integer('api_id').notNull().unique(),
  fullName: text('full_name').notNull(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  teamId: integer('team_id').references(() => teams.id),
  position: text('position'),
  height: text('height'),
  weight: text('weight'),
  college: text('college'),
  country: text('country'),
  draftYear: integer('draft_year'),
  birthdate: date('birthdate'),
}, (table) => ({
  apiIdIdx: index('players_api_id_idx').on(table.apiId),
  teamIdIdx: index('players_team_id_idx').on(table.teamId),
  positionIdx: index('players_position_idx').on(table.position),
}));

/**
 * Games table
 * Stores NBA game information
 */
export const games = pgTable('games', {
  id: serial('id').primaryKey(),
  apiId: integer('api_id').notNull().unique(),
  season: integer('season').notNull(),
  date: date('date').notNull(),
  homeTeamId: integer('home_team_id').references(() => teams.id).notNull(),
  awayTeamId: integer('away_team_id').references(() => teams.id).notNull(),
  homeScore: integer('home_score'),
  awayScore: integer('away_score'),
}, (table) => ({
  apiIdIdx: index('games_api_id_idx').on(table.apiId),
  seasonIdx: index('games_season_idx').on(table.season),
  dateIdx: index('games_date_idx').on(table.date),
  homeTeamIdIdx: index('games_home_team_id_idx').on(table.homeTeamId),
  awayTeamIdIdx: index('games_away_team_id_idx').on(table.awayTeamId),
}));

/**
 * Box Scores table
 * Stores player performance statistics for each game
 */
export const boxScores = pgTable('box_scores', {
  id: serial('id').primaryKey(),
  gameId: integer('game_id').references(() => games.id).notNull(),
  playerId: integer('player_id').references(() => players.id).notNull(),
  teamId: integer('team_id').references(() => teams.id).notNull(),
  minutes: real('minutes'),
  points: real('points'),
  assists: real('assists'),
  rebounds: real('rebounds'),
  steals: real('steals'),
  blocks: real('blocks'),
  turnovers: real('turnovers'),
  fgm: real('fgm'),
  fga: real('fga'),
  tpm: real('tpm'),
  tpa: real('tpa'),
  ftm: real('ftm'),
  fta: real('fta'),
}, (table) => ({
  gamePlayerUnique: unique('box_scores_game_player_unique').on(table.gameId, table.playerId),
  gameIdIdx: index('box_scores_game_id_idx').on(table.gameId),
  playerIdIdx: index('box_scores_player_id_idx').on(table.playerId),
  teamIdIdx: index('box_scores_team_id_idx').on(table.teamId),
}));

/**
 * Leaders table
 * Stores NBA season leaders for various statistical categories
 */
export const leaders = pgTable('leaders', {
  id: serial('id').primaryKey(),
  playerId: integer('player_id').references(() => players.id).notNull(),
  season: integer('season').notNull(),
  statType: text('stat_type').notNull(), // pts, reb, ast, stl, blk
  value: real('value').notNull(),
  rank: integer('rank').notNull(),
  gamesPlayed: integer('games_played').notNull(),
}, (table) => ({
  playerSeasonStatUnique: unique('leaders_player_season_stat_unique').on(table.playerId, table.season, table.statType),
  playerIdIdx: index('leaders_player_id_idx').on(table.playerId),
  seasonIdx: index('leaders_season_idx').on(table.season),
  statTypeIdx: index('leaders_stat_type_idx').on(table.statType),
  rankIdx: index('leaders_rank_idx').on(table.rank),
}));

/**
 * Season Averages table
 * Stores player season averages including shooting percentages
 */
export const seasonAverages = pgTable('season_averages', {
  id: serial('id').primaryKey(),
  playerId: integer('player_id').references(() => players.id).notNull(),
  season: integer('season').notNull(),
  gamesPlayed: integer('games_played'),
  minutes: real('minutes'),
  points: real('points'),
  assists: real('assists'),
  rebounds: real('rebounds'),
  steals: real('steals'),
  blocks: real('blocks'),
  turnovers: real('turnovers'),
  fgm: real('fgm'),
  fga: real('fga'),
  fgPct: real('fg_pct'), // Field goal percentage
  tpm: real('tpm'),
  tpa: real('tpa'),
  threePct: real('three_pct'), // Three point percentage
  ftm: real('ftm'),
  fta: real('fta'),
  ftPct: real('ft_pct'), // Free throw percentage
}, (table) => ({
  playerSeasonUnique: unique('season_averages_player_season_unique').on(table.playerId, table.season),
  playerIdIdx: index('season_averages_player_id_idx').on(table.playerId),
  seasonIdx: index('season_averages_season_idx').on(table.season),
}));

/**
 * Standings table
 * Stores NBA team standings for each season
 */
export const standings = pgTable('standings', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id').references(() => teams.id).notNull(),
  season: integer('season').notNull(),
  wins: integer('wins').notNull(),
  losses: integer('losses').notNull(),
  conferenceRank: integer('conference_rank'),
  divisionRank: integer('division_rank'),
  conferenceRecord: text('conference_record'),
  divisionRecord: text('division_record'),
  homeRecord: text('home_record'),
  roadRecord: text('road_record'),
}, (table) => ({
  teamSeasonUniqueIdx: uniqueIndex('standings_team_season_unique').on(table.teamId, table.season),
  teamIdIdx: index('standings_team_id_idx').on(table.teamId),
  seasonIdx: index('standings_season_idx').on(table.season),
}));

// ============================================================================
// Relations (for Drizzle joins)
// ============================================================================

export const teamsRelations = relations(teams, ({ many }) => ({
  players: many(players),
  homeGames: many(games, { relationName: 'homeTeam' }),
  awayGames: many(games, { relationName: 'awayTeam' }),
  boxScores: many(boxScores),
  standings: many(standings),
}));

export const playersRelations = relations(players, ({ one, many }) => ({
  team: one(teams, {
    fields: [players.teamId],
    references: [teams.id],
  }),
  boxScores: many(boxScores),
  leaders: many(leaders),
  seasonAverages: many(seasonAverages),
}));

export const gamesRelations = relations(games, ({ one, many }) => ({
  homeTeam: one(teams, {
    fields: [games.homeTeamId],
    references: [teams.id],
    relationName: 'homeTeam',
  }),
  awayTeam: one(teams, {
    fields: [games.awayTeamId],
    references: [teams.id],
    relationName: 'awayTeam',
  }),
  boxScores: many(boxScores),
}));

export const boxScoresRelations = relations(boxScores, ({ one }) => ({
  game: one(games, {
    fields: [boxScores.gameId],
    references: [games.id],
  }),
  player: one(players, {
    fields: [boxScores.playerId],
    references: [players.id],
  }),
  team: one(teams, {
    fields: [boxScores.teamId],
    references: [teams.id],
  }),
}));

export const leadersRelations = relations(leaders, ({ one }) => ({
  player: one(players, {
    fields: [leaders.playerId],
    references: [players.id],
  }),
}));

export const standingsRelations = relations(standings, ({ one }) => ({
  team: one(teams, {
    fields: [standings.teamId],
    references: [teams.id],
  }),
}));

export const seasonAveragesRelations = relations(seasonAverages, ({ one }) => ({
  player: one(players, {
    fields: [seasonAverages.playerId],
    references: [players.id],
  }),
}));

// ============================================================================
// Type Exports
// ============================================================================

export type Team = typeof teams.$inferSelect;
export type NewTeam = typeof teams.$inferInsert;

export type Player = typeof players.$inferSelect;
export type NewPlayer = typeof players.$inferInsert;

export type Game = typeof games.$inferSelect;
export type NewGame = typeof games.$inferInsert;

export type BoxScore = typeof boxScores.$inferSelect;
export type NewBoxScore = typeof boxScores.$inferInsert;

export type Leader = typeof leaders.$inferSelect;
export type NewLeader = typeof leaders.$inferInsert;

export type Standing = typeof standings.$inferSelect;
export type NewStanding = typeof standings.$inferInsert;

export type SeasonAverage = typeof seasonAverages.$inferSelect;
export type NewSeasonAverage = typeof seasonAverages.$inferInsert;

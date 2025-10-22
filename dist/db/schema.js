import { pgTable, serial, integer, text, date, real, unique, index } from 'drizzle-orm/pg-core';
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
// ============================================================================
// Relations (for Drizzle joins)
// ============================================================================
export const teamsRelations = relations(teams, ({ many }) => ({
    players: many(players),
    homeGames: many(games, { relationName: 'homeTeam' }),
    awayGames: many(games, { relationName: 'awayTeam' }),
    boxScores: many(boxScores),
}));
export const playersRelations = relations(players, ({ one, many }) => ({
    team: one(teams, {
        fields: [players.teamId],
        references: [teams.id],
    }),
    boxScores: many(boxScores),
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
//# sourceMappingURL=schema.js.map
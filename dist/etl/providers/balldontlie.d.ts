import { z } from 'zod';
declare const TeamSchema: z.ZodObject<{
    id: z.ZodNumber;
    name: z.ZodString;
    abbreviation: z.ZodString;
    city: z.ZodString;
    conference: z.ZodString;
    division: z.ZodString;
}, z.core.$strip>;
declare const PlayerSchema: z.ZodObject<{
    id: z.ZodNumber;
    first_name: z.ZodString;
    last_name: z.ZodString;
    position: z.ZodNullable<z.ZodString>;
    height: z.ZodNullable<z.ZodString>;
    weight: z.ZodNullable<z.ZodString>;
    jersey_number: z.ZodNullable<z.ZodString>;
    college: z.ZodNullable<z.ZodString>;
    country: z.ZodNullable<z.ZodString>;
    draft_year: z.ZodNullable<z.ZodNumber>;
    draft_round: z.ZodNullable<z.ZodNumber>;
    draft_number: z.ZodNullable<z.ZodNumber>;
    team: z.ZodNullable<z.ZodObject<{
        id: z.ZodNumber;
        name: z.ZodString;
        abbreviation: z.ZodString;
        city: z.ZodString;
        conference: z.ZodString;
        division: z.ZodString;
    }, z.core.$strip>>;
}, z.core.$strip>;
declare const GameSchema: z.ZodObject<{
    id: z.ZodNumber;
    date: z.ZodString;
    season: z.ZodNumber;
    status: z.ZodString;
    period: z.ZodNullable<z.ZodNumber>;
    time: z.ZodNullable<z.ZodString>;
    postseason: z.ZodBoolean;
    home_team: z.ZodObject<{
        id: z.ZodNumber;
        name: z.ZodString;
        abbreviation: z.ZodString;
        city: z.ZodString;
        conference: z.ZodString;
        division: z.ZodString;
    }, z.core.$strip>;
    visitor_team: z.ZodObject<{
        id: z.ZodNumber;
        name: z.ZodString;
        abbreviation: z.ZodString;
        city: z.ZodString;
        conference: z.ZodString;
        division: z.ZodString;
    }, z.core.$strip>;
    home_team_score: z.ZodNullable<z.ZodNumber>;
    visitor_team_score: z.ZodNullable<z.ZodNumber>;
}, z.core.$strip>;
declare const BoxScoreSchema: z.ZodObject<{
    id: z.ZodNumber;
    game: z.ZodObject<{
        id: z.ZodNumber;
        date: z.ZodString;
        season: z.ZodNumber;
    }, z.core.$strip>;
    player: z.ZodObject<{
        id: z.ZodNumber;
        first_name: z.ZodString;
        last_name: z.ZodString;
    }, z.core.$strip>;
    team: z.ZodObject<{
        id: z.ZodNumber;
        name: z.ZodString;
        abbreviation: z.ZodString;
        city: z.ZodString;
        conference: z.ZodString;
        division: z.ZodString;
    }, z.core.$strip>;
    min: z.ZodNullable<z.ZodString>;
    fgm: z.ZodNullable<z.ZodNumber>;
    fga: z.ZodNullable<z.ZodNumber>;
    fg3m: z.ZodNullable<z.ZodNumber>;
    fg3a: z.ZodNullable<z.ZodNumber>;
    ftm: z.ZodNullable<z.ZodNumber>;
    fta: z.ZodNullable<z.ZodNumber>;
    oreb: z.ZodNullable<z.ZodNumber>;
    dreb: z.ZodNullable<z.ZodNumber>;
    reb: z.ZodNullable<z.ZodNumber>;
    ast: z.ZodNullable<z.ZodNumber>;
    stl: z.ZodNullable<z.ZodNumber>;
    blk: z.ZodNullable<z.ZodNumber>;
    turnover: z.ZodNullable<z.ZodNumber>;
    pf: z.ZodNullable<z.ZodNumber>;
    pts: z.ZodNullable<z.ZodNumber>;
}, z.core.$strip>;
export type ApiTeam = z.infer<typeof TeamSchema>;
export type ApiPlayer = z.infer<typeof PlayerSchema>;
export type ApiGame = z.infer<typeof GameSchema>;
export type ApiBoxScore = z.infer<typeof BoxScoreSchema>;
/**
 * Fetch all NBA teams
 */
export declare function fetchTeams(): Promise<ApiTeam[]>;
/**
 * Fetch active players with optional filters
 */
export declare function fetchPlayers(options?: {
    season?: number;
    pageSize?: number;
    teamIds?: number[];
}): Promise<ApiPlayer[]>;
/**
 * Fetch games by date (ISO format YYYY-MM-DD)
 */
export declare function fetchGamesByDate(dateISO: string): Promise<ApiGame[]>;
/**
 * Fetch box scores for a specific game by game API ID
 */
export declare function fetchBoxScoresByGame(gameApiId: number): Promise<ApiBoxScore[]>;
/**
 * Parse minutes string to decimal number (e.g., "25:30" -> 25.5)
 */
export declare function parseMinutes(minStr: string | null): number | null;
/**
 * Ensure value is a number or null
 */
export declare function normalizeNumber(value: any): number | null;
/**
 * Normalize box score stats to ensure all are numbers
 */
export declare function normalizeBoxScore(boxScore: ApiBoxScore): {
    min: number | null;
    fgm: number | null;
    fga: number | null;
    fg3m: number | null;
    fg3a: number | null;
    ftm: number | null;
    fta: number | null;
    oreb: number | null;
    dreb: number | null;
    reb: number | null;
    ast: number | null;
    stl: number | null;
    blk: number | null;
    turnover: number | null;
    pf: number | null;
    pts: number | null;
    id: number;
    game: {
        id: number;
        date: string;
        season: number;
    };
    player: {
        id: number;
        first_name: string;
        last_name: string;
    };
    team: {
        id: number;
        name: string;
        abbreviation: string;
        city: string;
        conference: string;
        division: string;
    };
};
export {};
//# sourceMappingURL=balldontlie.d.ts.map
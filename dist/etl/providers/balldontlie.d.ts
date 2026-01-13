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
declare const LeaderSchema: z.ZodObject<{
    player: z.ZodObject<{
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
        team_id: z.ZodNullable<z.ZodNumber>;
    }, z.core.$strip>;
    value: z.ZodNumber;
    stat_type: z.ZodString;
    rank: z.ZodNumber;
    season: z.ZodNumber;
    games_played: z.ZodNumber;
}, z.core.$strip>;
declare const StandingSchema: z.ZodObject<{
    team: z.ZodObject<{
        id: z.ZodNumber;
        name: z.ZodString;
        abbreviation: z.ZodString;
        city: z.ZodString;
        conference: z.ZodString;
        division: z.ZodString;
    }, z.core.$strip>;
    conference_record: z.ZodNullable<z.ZodString>;
    conference_rank: z.ZodNullable<z.ZodNumber>;
    division_record: z.ZodNullable<z.ZodString>;
    division_rank: z.ZodNullable<z.ZodNumber>;
    wins: z.ZodNumber;
    losses: z.ZodNumber;
    home_record: z.ZodNullable<z.ZodString>;
    road_record: z.ZodNullable<z.ZodString>;
    season: z.ZodNumber;
}, z.core.$strip>;
declare const SeasonAverageSchema: z.ZodObject<{
    season: z.ZodNumber;
    player: z.ZodObject<{
        id: z.ZodNumber;
        first_name: z.ZodOptional<z.ZodString>;
        last_name: z.ZodOptional<z.ZodString>;
        position: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        height: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        weight: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        jersey_number: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        college: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        country: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        draft_year: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        draft_round: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        draft_number: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    }, z.core.$strip>;
    season_type: z.ZodOptional<z.ZodString>;
    stats: z.ZodObject<{
        gp: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        min: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        pts: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        ast: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        reb: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        stl: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        blk: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        tov: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        fgm: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        fga: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        fg_pct: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        fg3m: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        fg3a: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        fg3_pct: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        ftm: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        fta: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        ft_pct: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    }, z.core.$strip>;
}, z.core.$loose>;
declare const AdvancedSeasonAverageSchema: z.ZodObject<{
    season: z.ZodNumber;
    player: z.ZodObject<{
        id: z.ZodNumber;
        first_name: z.ZodOptional<z.ZodString>;
        last_name: z.ZodOptional<z.ZodString>;
        position: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        height: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        weight: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        jersey_number: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        college: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        country: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        draft_year: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        draft_round: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        draft_number: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    }, z.core.$strip>;
    season_type: z.ZodOptional<z.ZodString>;
    stats: z.ZodObject<{
        gp: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        min: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        pts: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        ast: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        reb: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        stl: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        blk: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        tov: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        fgm: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        fga: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        fg_pct: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        fg3m: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        fg3a: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        fg3_pct: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        ftm: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        fta: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        ft_pct: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        l: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        w: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        age: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        pie: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        pace: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        poss: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        w_pct: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        ast_to: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        e_pace: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        fga_pg: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        fgm_pg: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        ts_pct: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        ast_pct: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        efg_pct: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        reb_pct: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        usg_pct: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        dreb_pct: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        oreb_pct: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        ast_ratio: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        e_tov_pct: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        e_usg_pct: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        def_rating: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        net_rating: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        off_rating: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        pace_per40: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        team_count: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        tm_tov_pct: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        e_def_rating: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        e_net_rating: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        e_off_rating: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        sp_work_pace: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        sp_work_def_rating: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        sp_work_net_rating: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        sp_work_off_rating: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    }, z.core.$strip>;
}, z.core.$loose>;
declare const ContractSchema: z.ZodObject<{
    id: z.ZodNumber;
    player_id: z.ZodNumber;
    season: z.ZodNumber;
    team_id: z.ZodNumber;
    cap_hit: z.ZodNullable<z.ZodNumber>;
    total_cash: z.ZodNullable<z.ZodNumber>;
    base_salary: z.ZodNullable<z.ZodNumber>;
    rank: z.ZodNullable<z.ZodNumber>;
    player: z.ZodObject<{
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
        team_id: z.ZodNullable<z.ZodNumber>;
    }, z.core.$strip>;
    team: z.ZodObject<{
        id: z.ZodNumber;
        name: z.ZodString;
        abbreviation: z.ZodString;
        city: z.ZodString;
        conference: z.ZodString;
        division: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export type ApiTeam = z.infer<typeof TeamSchema>;
export type ApiPlayer = z.infer<typeof PlayerSchema>;
export type ApiGame = z.infer<typeof GameSchema>;
export type ApiBoxScore = z.infer<typeof BoxScoreSchema>;
export type ApiLeader = z.infer<typeof LeaderSchema>;
export type ApiStanding = z.infer<typeof StandingSchema>;
export type ApiSeasonAverage = z.infer<typeof SeasonAverageSchema>;
export type ApiAdvancedSeasonAverage = z.infer<typeof AdvancedSeasonAverageSchema>;
export type ApiContract = z.infer<typeof ContractSchema>;
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
 * Fetch season leaders for a specific statistical category
 */
export declare function fetchLeaders(season: number, statType: string): Promise<ApiLeader[]>;
/**
 * Fetch standings for a specific season
 */
export declare function fetchStandings(season: number): Promise<ApiStanding[]>;
/**
 * Fetch season averages for general/base stats including shooting percentages
 * Category: general, Type: base
 * Can filter by player_ids array for efficiency
 * Batches player_ids into chunks of 25 to avoid URL length limits
 */
export declare function fetchSeasonAverages(season: number, seasonType?: string, playerIds?: number[]): Promise<ApiSeasonAverage[]>;
/**
 * Fetch advanced season averages for general/advanced stats
 * Category: general, Type: advanced
 * Can filter by player_ids array for efficiency
 * Batches player_ids into chunks of 25 to avoid URL length limits
 */
export declare function fetchAdvancedSeasonAverages(season: number, seasonType?: string, playerIds?: number[]): Promise<ApiAdvancedSeasonAverage[]>;
/**
 * Fetch team contracts for a specific team and season
 * Endpoint: GET /contracts/teams
 */
export declare function fetchTeamContracts(teamId: number, season?: number): Promise<ApiContract[]>;
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
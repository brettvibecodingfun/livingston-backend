import { z } from 'zod';

// Environment variables
const BALLDONTLIE_BASE = process.env.BALLDONTLIE_BASE || 'https://api.balldontlie.io/v1';
const BALLDONTLIE_KEY = process.env.BALLDONTLIE_KEY;

if (!BALLDONTLIE_KEY) {
  console.warn('⚠️  BALLDONTLIE_KEY not set - API requests may fail');
}

// ============================================================================
// Zod Schemas for API Responses
// ============================================================================

const TeamSchema = z.object({
  id: z.number(),
  name: z.string(),
  abbreviation: z.string(),
  city: z.string(),
  conference: z.string(),
  division: z.string(),
});

const PlayerSchema = z.object({
  id: z.number(),
  first_name: z.string(),
  last_name: z.string(),
  position: z.string().nullable(),
  height: z.string().nullable(),
  weight: z.string().nullable(),
  jersey_number: z.string().nullable(),
  college: z.string().nullable(),
  country: z.string().nullable(),
  draft_year: z.number().nullable(),
  draft_round: z.number().nullable(),
  draft_number: z.number().nullable(),
  team: z.object({
    id: z.number(),
    name: z.string(),
    abbreviation: z.string(),
    city: z.string(),
    conference: z.string(),
    division: z.string(),
  }).nullable(),
});

const GameSchema = z.object({
  id: z.number(),
  date: z.string(),
  season: z.number(),
  status: z.string(),
  period: z.number().nullable(),
  time: z.string().nullable(),
  postseason: z.boolean(),
  home_team: z.object({
    id: z.number(),
    name: z.string(),
    abbreviation: z.string(),
    city: z.string(),
    conference: z.string(),
    division: z.string(),
  }),
  visitor_team: z.object({
    id: z.number(),
    name: z.string(),
    abbreviation: z.string(),
    city: z.string(),
    conference: z.string(),
    division: z.string(),
  }),
  home_team_score: z.number().nullable(),
  visitor_team_score: z.number().nullable(),
});

const BoxScoreSchema = z.object({
  id: z.number(),
  game: z.object({
    id: z.number(),
    date: z.string(),
    season: z.number(),
  }),
  player: z.object({
    id: z.number(),
    first_name: z.string(),
    last_name: z.string(),
  }),
  team: z.object({
    id: z.number(),
    name: z.string(),
    abbreviation: z.string(),
    city: z.string(),
    conference: z.string(),
    division: z.string(),
  }),
  min: z.string().nullable(),
  fgm: z.number().nullable(),
  fga: z.number().nullable(),
  fg3m: z.number().nullable(),
  fg3a: z.number().nullable(),
  ftm: z.number().nullable(),
  fta: z.number().nullable(),
  oreb: z.number().nullable(),
  dreb: z.number().nullable(),
  reb: z.number().nullable(),
  ast: z.number().nullable(),
  stl: z.number().nullable(),
  blk: z.number().nullable(),
  turnover: z.number().nullable(),
  pf: z.number().nullable(),
  pts: z.number().nullable(),
});

const LeaderSchema = z.object({
  player: z.object({
    id: z.number(),
    first_name: z.string(),
    last_name: z.string(),
    position: z.string().nullable(),
    height: z.string().nullable(),
    weight: z.string().nullable(),
    jersey_number: z.string().nullable(),
    college: z.string().nullable(),
    country: z.string().nullable(),
    draft_year: z.number().nullable(),
    draft_round: z.number().nullable(),
    draft_number: z.number().nullable(),
    team_id: z.number().nullable(),
  }),
  value: z.number(),
  stat_type: z.string(),
  rank: z.number(),
  season: z.number(),
  games_played: z.number(),
});

const PaginatedResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    data: z.array(dataSchema),
    meta: z.object({
      next_cursor: z.number().nullable().optional(),
      per_page: z.number().optional(),
      current_page: z.number().optional(),
    }),
  });

// Type exports
export type ApiTeam = z.infer<typeof TeamSchema>;
export type ApiPlayer = z.infer<typeof PlayerSchema>;
export type ApiGame = z.infer<typeof GameSchema>;
export type ApiBoxScore = z.infer<typeof BoxScoreSchema>;
export type ApiLeader = z.infer<typeof LeaderSchema>;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Sleep for throttling requests
 */
async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Throttle between pages (200-300ms)
 */
async function throttle(): Promise<void> {
  const delay = Math.floor(Math.random() * 100) + 200; // 200-300ms
  await sleep(delay);
}

/**
 * Make HTTP request to BallDontLie API
 */
async function fetchFromAPI<T>(
  endpoint: string,
  schema: z.ZodSchema<T>,
  params: Record<string, any> = {}
): Promise<T> {
  const url = new URL(`${BALLDONTLIE_BASE}${endpoint}`);
  
  // Add query parameters
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if ((key === 'team_ids' || key === 'dates' || key === 'game_ids') && Array.isArray(value)) {
        // Special handling for array parameters: ?team_ids[]=1&team_ids[]=2 or ?dates[]=2024-01-01 or ?game_ids[]=123
        value.forEach(item => url.searchParams.append(`${key}[]`, item.toString()));
      } else {
        url.searchParams.append(key, value.toString());
      }
    }
  });

  const headers: Record<string, string> = {
    'Accept': 'application/json',
  };

  if (BALLDONTLIE_KEY) {
    headers['Authorization'] = BALLDONTLIE_KEY;
  }

  console.log(`📡 GET ${url.pathname}${url.search}`);

  const response = await fetch(url.toString(), { headers });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  
  // Validate with Zod and throw on invalid response
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    console.error('❌ Invalid API response:', parsed.error);
    throw new Error(`Invalid API response: ${parsed.error.message}`);
  }
  
  return parsed.data;
}

/**
 * Fetch all pages from a paginated endpoint
 */
async function fetchAllPages<T>(
  endpoint: string,
  itemSchema: z.ZodTypeAny,
  params: Record<string, any> = {}
): Promise<T[]> {
  const results: T[] = [];
  let cursor: number | null | undefined = undefined;
  let pageCount = 0;

  do {
    const responseSchema = PaginatedResponseSchema(itemSchema);
    const fetchParams: Record<string, any> = { ...params };
    
    if (cursor !== undefined && cursor !== null) {
      fetchParams.cursor = cursor;
    }
    
    const response = await fetchFromAPI(endpoint, responseSchema, fetchParams);
    
    results.push(...(response.data as T[]));
    cursor = response.meta.next_cursor;
    pageCount++;

    console.log(`  📄 Page ${pageCount}: ${response.data.length} items (total: ${results.length})`);

    // Throttle between pages
    if (cursor) {
      await throttle();
    }
  } while (cursor);

  return results;
}

// ============================================================================
// Public API Functions
// ============================================================================

/**
 * Fetch all NBA teams
 */
export async function fetchTeams(): Promise<ApiTeam[]> {
  console.log('🏀 Fetching teams...');
  const response = await fetchFromAPI('/teams', z.object({ data: z.array(TeamSchema) }));
  return response.data;
}

/**
 * Fetch active players with optional filters
 */
export async function fetchPlayers(options: {
  season?: number;
  pageSize?: number;
  teamIds?: number[];
} = {}): Promise<ApiPlayer[]> {
  console.log('👥 Fetching active players...', options);
  
  const params: Record<string, any> = {};
  if (options.season) params.season = options.season;
  if (options.pageSize) params.per_page = options.pageSize;
  if (options.teamIds && options.teamIds.length > 0) {
    params.team_ids = options.teamIds;
  }
  
  return await fetchAllPages<ApiPlayer>('/players/active', PlayerSchema, params);
}

/**
 * Fetch games by date (ISO format YYYY-MM-DD)
 */
export async function fetchGamesByDate(dateISO: string): Promise<ApiGame[]> {
  console.log(`🎮 Fetching games for ${dateISO}...`);
  
  const params = {
    dates: [dateISO],
  };
  
  return await fetchAllPages<ApiGame>('/games', GameSchema, params);
}

/**
 * Fetch box scores for a specific game by game API ID
 */
export async function fetchBoxScoresByGame(gameApiId: number): Promise<ApiBoxScore[]> {
  console.log(`📊 Fetching box scores for game ${gameApiId}...`);
  
  const params = {
    game_ids: [gameApiId],
  };
  
  return await fetchAllPages<ApiBoxScore>('/stats', BoxScoreSchema, params);
}

/**
 * Fetch season leaders for a specific statistical category
 */
export async function fetchLeaders(season: number, statType: string): Promise<ApiLeader[]> {
  console.log(`🏆 Fetching ${statType} leaders for season ${season}...`);
  
  const params = {
    season,
    stat_type: statType,
  };
  
  const response = await fetchFromAPI('/leaders', z.object({ data: z.array(LeaderSchema) }), params);
  return response.data;
}

// ============================================================================
// Data Normalization Helpers
// ============================================================================

/**
 * Parse minutes string to decimal number (e.g., "25:30" -> 25.5)
 */
export function parseMinutes(minStr: string | null): number | null {
  if (!minStr) return null;
  
  const parts = minStr.split(':');
  if (parts.length !== 2) return null;
  
  const minutes = parseInt(parts[0] || '0', 10);
  const seconds = parseInt(parts[1] || '0', 10);
  
  return minutes + (seconds / 60);
}

/**
 * Ensure value is a number or null
 */
export function normalizeNumber(value: any): number | null {
  if (value === null || value === undefined) return null;
  const num = Number(value);
  return isNaN(num) ? null : num;
}

/**
 * Normalize box score stats to ensure all are numbers
 */
export function normalizeBoxScore(boxScore: ApiBoxScore) {
  return {
    ...boxScore,
    min: parseMinutes(boxScore.min),
    fgm: normalizeNumber(boxScore.fgm),
    fga: normalizeNumber(boxScore.fga),
    fg3m: normalizeNumber(boxScore.fg3m),
    fg3a: normalizeNumber(boxScore.fg3a),
    ftm: normalizeNumber(boxScore.ftm),
    fta: normalizeNumber(boxScore.fta),
    oreb: normalizeNumber(boxScore.oreb),
    dreb: normalizeNumber(boxScore.dreb),
    reb: normalizeNumber(boxScore.reb),
    ast: normalizeNumber(boxScore.ast),
    stl: normalizeNumber(boxScore.stl),
    blk: normalizeNumber(boxScore.blk),
    turnover: normalizeNumber(boxScore.turnover),
    pf: normalizeNumber(boxScore.pf),
    pts: normalizeNumber(boxScore.pts),
  };
}

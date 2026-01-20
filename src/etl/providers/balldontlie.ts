import { z } from 'zod';

// Environment variables
const BALLDONTLIE_BASE = process.env.BALLDONTLIE_BASE || 'https://api.balldontlie.io/v1';
const BALLDONTLIE_NBA_BASE = process.env.BALLDONTLIE_NBA_BASE || 'https://api.balldontlie.io/nba/v1';

// Read BALLDONTLIE_KEY lazily (at function call time) to ensure dotenv has loaded
function getBallDontLieKey(): string | undefined {
  return process.env.BALLDONTLIE_KEY;
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

const StandingSchema = z.object({
  team: TeamSchema,
  conference_record: z.string().nullable(),
  conference_rank: z.number().nullable(),
  division_record: z.string().nullable(),
  division_rank: z.number().nullable(),
  wins: z.number(),
  losses: z.number(),
  home_record: z.string().nullable(),
  road_record: z.string().nullable(),
  season: z.number(),
});

// Schema that allows undefined player_id (API sometimes returns entries without it)
const SeasonAverageSchema = z.object({
  season: z.number(),
  player: z.object({
    id: z.number(),
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    position: z.string().nullable().optional(),
    height: z.string().nullable().optional(),
    weight: z.string().nullable().optional(),
    jersey_number: z.string().nullable().optional(),
    college: z.string().nullable().optional(),
    country: z.string().nullable().optional(),
    draft_year: z.number().nullable().optional(),
    draft_round: z.number().nullable().optional(),
    draft_number: z.number().nullable().optional(),
  }),
  season_type: z.string().optional(),
  stats: z.object({
    gp: z.number().nullable().optional(),
    min: z.number().nullable().optional(),
    pts: z.number().nullable().optional(),
    ast: z.number().nullable().optional(),
    reb: z.number().nullable().optional(),
    stl: z.number().nullable().optional(),
    blk: z.number().nullable().optional(),
    tov: z.number().nullable().optional(),
    fgm: z.number().nullable().optional(),
    fga: z.number().nullable().optional(),
    fg_pct: z.number().nullable().optional(),
    fg3m: z.number().nullable().optional(),
    fg3a: z.number().nullable().optional(),
    fg3_pct: z.number().nullable().optional(),
    ftm: z.number().nullable().optional(),
    fta: z.number().nullable().optional(),
    ft_pct: z.number().nullable().optional(),
    age: z.number().nullable().optional(), // Age at start of season (from historical API)
  }),
}).passthrough(); // Allow extra fields we don't know about

// Advanced season averages schema with all advanced stats (excluding rankings)
const AdvancedSeasonAverageSchema = z.object({
  season: z.number(),
  player: z.object({
    id: z.number(),
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    position: z.string().nullable().optional(),
    height: z.string().nullable().optional(),
    weight: z.string().nullable().optional(),
    jersey_number: z.string().nullable().optional(),
    college: z.string().nullable().optional(),
    country: z.string().nullable().optional(),
    draft_year: z.number().nullable().optional(),
    draft_round: z.number().nullable().optional(),
    draft_number: z.number().nullable().optional(),
  }),
  season_type: z.string().optional(),
  stats: z.object({
    // Base stats (same as SeasonAverageSchema)
    gp: z.number().nullable().optional(),
    min: z.number().nullable().optional(),
    pts: z.number().nullable().optional(),
    ast: z.number().nullable().optional(),
    reb: z.number().nullable().optional(),
    stl: z.number().nullable().optional(),
    blk: z.number().nullable().optional(),
    tov: z.number().nullable().optional(),
    fgm: z.number().nullable().optional(),
    fga: z.number().nullable().optional(),
    fg_pct: z.number().nullable().optional(),
    fg3m: z.number().nullable().optional(),
    fg3a: z.number().nullable().optional(),
    fg3_pct: z.number().nullable().optional(),
    ftm: z.number().nullable().optional(),
    fta: z.number().nullable().optional(),
    ft_pct: z.number().nullable().optional(),
    // Advanced stats (excluding rankings)
    l: z.number().nullable().optional(), // losses
    w: z.number().nullable().optional(), // wins
    age: z.number().nullable().optional(),
    pie: z.number().nullable().optional(), // Player impact estimate
    pace: z.number().nullable().optional(),
    poss: z.number().nullable().optional(), // possessions
    w_pct: z.number().nullable().optional(), // win percentage
    ast_to: z.number().nullable().optional(), // assist to turnover ratio
    e_pace: z.number().nullable().optional(), // estimated pace
    fga_pg: z.number().nullable().optional(), // field goals attempted per game
    fgm_pg: z.number().nullable().optional(), // field goals made per game
    ts_pct: z.number().nullable().optional(), // true shooting percentage
    ast_pct: z.number().nullable().optional(), // assist percentage
    efg_pct: z.number().nullable().optional(), // effective field goal percentage
    reb_pct: z.number().nullable().optional(), // rebound percentage
    usg_pct: z.number().nullable().optional(), // usage percentage
    dreb_pct: z.number().nullable().optional(), // defensive rebound percentage
    oreb_pct: z.number().nullable().optional(), // offensive rebound percentage
    ast_ratio: z.number().nullable().optional(), // assist ratio
    e_tov_pct: z.number().nullable().optional(), // estimated turnover percentage
    e_usg_pct: z.number().nullable().optional(), // estimated usage percentage
    def_rating: z.number().nullable().optional(), // defensive rating
    net_rating: z.number().nullable().optional(), // net rating
    off_rating: z.number().nullable().optional(), // offensive rating
    pace_per40: z.number().nullable().optional(), // pace per 40 minutes
    team_count: z.number().nullable().optional(),
    tm_tov_pct: z.number().nullable().optional(), // team turnover percentage
    e_def_rating: z.number().nullable().optional(), // estimated defensive rating
    e_net_rating: z.number().nullable().optional(), // estimated net rating
    e_off_rating: z.number().nullable().optional(), // estimated offensive rating
    sp_work_pace: z.number().nullable().optional(), // space work pace
    sp_work_def_rating: z.number().nullable().optional(), // space work defensive rating
    sp_work_net_rating: z.number().nullable().optional(), // space work net rating
    sp_work_off_rating: z.number().nullable().optional(), // space work offensive rating
  }),
}).passthrough(); // Allow extra fields we don't know about

const ContractSchema = z.object({
  id: z.number(),
  player_id: z.number(),
  season: z.number(),
  team_id: z.number(),
  cap_hit: z.number().nullable(),
  total_cash: z.number().nullable(),
  base_salary: z.number().nullable(),
  rank: z.number().nullable(),
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
  team: TeamSchema,
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
export type ApiStanding = z.infer<typeof StandingSchema>;
export type ApiSeasonAverage = z.infer<typeof SeasonAverageSchema>;
export type ApiAdvancedSeasonAverage = z.infer<typeof AdvancedSeasonAverageSchema>;
export type ApiContract = z.infer<typeof ContractSchema>;

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
 * Make HTTP request to BallDontLie API (NBA v1 endpoint)
 */
async function fetchFromNBAAPI<T>(
  endpoint: string,
  schema: z.ZodSchema<T>,
  params: Record<string, any> = {}
): Promise<T> {
  const url = new URL(`${BALLDONTLIE_NBA_BASE}${endpoint}`);
  
  // Add query parameters
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if ((key === 'team_ids' || key === 'dates' || key === 'game_ids' || key === 'player_ids') && Array.isArray(value)) {
        // Special handling for array parameters: ?team_ids[]=1&team_ids[]=2 or ?dates[]=2024-01-01 or ?game_ids[]=123 or ?player_ids[]=1
        value.forEach(item => url.searchParams.append(`${key}[]`, item.toString()));
      } else {
        url.searchParams.append(key, value.toString());
      }
    }
  });

  const headers: Record<string, string> = {
    'Accept': 'application/json',
  };
  
  const apiKey = getBallDontLieKey();
  if (apiKey) {
    headers['Authorization'] = apiKey;
  }

  console.log(`📡 GET ${url.pathname}${url.search}`);

  const response = await fetch(url.toString(), { headers });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API request failed: ${response.status} ${response.statusText}\n${errorText}`);
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
      if ((key === 'team_ids' || key === 'dates' || key === 'game_ids' || key === 'player_ids') && Array.isArray(value)) {
        // Special handling for array parameters: ?team_ids[]=1&team_ids[]=2 or ?dates[]=2024-01-01 or ?game_ids[]=123 or ?player_ids[]=1
        value.forEach(item => url.searchParams.append(`${key}[]`, item.toString()));
      } else {
        url.searchParams.append(key, value.toString());
      }
    }
  });

  const headers: Record<string, string> = {
    'Accept': 'application/json',
  };

  const apiKey = getBallDontLieKey();
  if (apiKey) {
    headers['Authorization'] = apiKey;
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

/**
 * Fetch standings for a specific season
 */
export async function fetchStandings(season: number): Promise<ApiStanding[]> {
  console.log(`📈 Fetching standings for season ${season}...`);

  const params = { season };

  const response = await fetchFromAPI(
    '/standings',
    z.object({ data: z.array(StandingSchema) }),
    params
  );

  return response.data;
}

/**
 * Fetch season averages for general/base stats including shooting percentages
 * Category: general, Type: base
 * Can filter by player_ids array for efficiency
 * Batches player_ids into chunks of 25 to avoid URL length limits
 */
export async function fetchSeasonAverages(
  season: number,
  seasonType: string = 'regular',
  playerIds?: number[]
): Promise<ApiSeasonAverage[]> {
  console.log(`📊 Fetching season averages (general/base) for season ${season}...`);
  
  const params: Record<string, any> = {
    season,
    season_type: seasonType,
    type: 'base',
  };

  // If no player IDs provided, fetch all (not recommended)
  if (!playerIds || playerIds.length === 0) {
    console.log(`  ⚠️  No player IDs provided, fetching all season averages`);
    const response = await fetchFromAPI(
      '/season_averages/general',
      z.object({ data: z.array(SeasonAverageSchema) }),
      params
    );
    return response.data.filter(avg => avg.player?.id !== undefined && avg.player?.id !== null);
  }

  // Batch player IDs into chunks of 25 to avoid URL length limits
  const BATCH_SIZE = 25;
  const batches: number[][] = [];
  for (let i = 0; i < playerIds.length; i += BATCH_SIZE) {
    batches.push(playerIds.slice(i, i + BATCH_SIZE));
  }

  console.log(`  👥 Filtering by ${playerIds.length} player IDs (${batches.length} batches)`);

  const allResults: ApiSeasonAverage[] = [];

  // Fetch each batch
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i]!; // Safe because we're iterating over batches we created
    console.log(`  📦 Batch ${i + 1}/${batches.length}: ${batch.length} players`);

    const batchParams = {
      ...params,
      player_ids: batch,
    };

    const response = await fetchFromAPI(
      '/season_averages/general',
      z.object({ data: z.array(SeasonAverageSchema) }),
      batchParams
    );

    // Filter to only include entries with player.id and season (required for our use case)
    const validResults = response.data.filter(
      avg => 
        avg.player?.id !== undefined && 
        avg.player?.id !== null && 
        avg.season !== undefined && 
        avg.season !== null
    );
    
    if (validResults.length < response.data.length) {
      console.log(`    ⚠️  Filtered out ${response.data.length - validResults.length} entries missing player.id or season`);
    }
    
    allResults.push(...validResults);

    // Throttle between batches to respect rate limits
    if (i < batches.length - 1) {
      await throttle();
    }
  }

  console.log(`  ✅ Fetched ${allResults.length} valid season averages from ${batches.length} batches`);
  return allResults;
}

/**
 * Fetch clutch season averages for clutch/base stats
 * Category: clutch, Type: base
 * Can filter by player_ids array for efficiency
 * Batches player_ids into chunks of 25 to avoid URL length limits
 */
export async function fetchClutchSeasonAverages(
  season: number,
  seasonType: string = 'regular',
  playerIds?: number[]
): Promise<ApiSeasonAverage[]> {
  console.log(`📊 Fetching clutch season averages (clutch/base) for season ${season}...`);
  
  const params: Record<string, any> = {
    season,
    season_type: seasonType,
    type: 'base',
  };

  // If no player IDs provided, fetch all (not recommended)
  if (!playerIds || playerIds.length === 0) {
    console.log(`  ⚠️  No player IDs provided, fetching all clutch season averages`);
    const response = await fetchFromAPI(
      '/season_averages/clutch',
      z.object({ data: z.array(SeasonAverageSchema) }),
      params
    );
    return response.data.filter(avg => avg.player?.id !== undefined && avg.player?.id !== null);
  }

  // Batch player IDs into chunks of 25 to avoid URL length limits
  const BATCH_SIZE = 25;
  const batches: number[][] = [];
  for (let i = 0; i < playerIds.length; i += BATCH_SIZE) {
    batches.push(playerIds.slice(i, i + BATCH_SIZE));
  }

  console.log(`  👥 Filtering by ${playerIds.length} player IDs (${batches.length} batches)`);

  const allResults: ApiSeasonAverage[] = [];

  // Fetch each batch
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i]!;
    console.log(`  📦 Batch ${i + 1}/${batches.length}: ${batch.length} players`);

    const batchParams = {
      ...params,
      player_ids: batch,
    };

    const response = await fetchFromAPI(
      '/season_averages/clutch',
      z.object({ data: z.array(SeasonAverageSchema) }),
      batchParams
    );

    // Filter to only include entries with player.id and season (required for our use case)
    const validResults = response.data.filter(
      avg => 
        avg.player?.id !== undefined && 
        avg.player?.id !== null && 
        avg.season !== undefined && 
        avg.season !== null
    );
    
    if (validResults.length < response.data.length) {
      console.log(`    ⚠️  Filtered out ${response.data.length - validResults.length} entries missing player.id or season`);
    }
    
    allResults.push(...validResults);

    // Throttle between batches to respect rate limits
    if (i < batches.length - 1) {
      await throttle();
    }
  }

  console.log(`  ✅ Fetched ${allResults.length} valid clutch season averages from ${batches.length} batches`);
  return allResults;
}

/**
 * Fetch advanced clutch season averages for clutch/advanced stats
 * Category: clutch, Type: advanced
 * Can filter by player_ids array for efficiency
 * Batches player_ids into chunks of 25 to avoid URL length limits
 */
export async function fetchAdvancedClutchSeasonAverages(
  season: number,
  seasonType: string = 'regular',
  playerIds?: number[]
): Promise<ApiAdvancedSeasonAverage[]> {
  console.log(`📊 Fetching advanced clutch season averages (clutch/advanced) for season ${season}...`);
  
  const params: Record<string, any> = {
    season,
    season_type: seasonType,
    type: 'advanced',
  };

  // If no player IDs provided, fetch all (not recommended)
  if (!playerIds || playerIds.length === 0) {
    console.log(`  ⚠️  No player IDs provided, fetching all advanced clutch season averages`);
    const response = await fetchFromAPI(
      '/season_averages/clutch',
      z.object({ data: z.array(AdvancedSeasonAverageSchema) }),
      params
    );
    return response.data.filter(avg => avg.player?.id !== undefined && avg.player?.id !== null);
  }

  // Batch player IDs into chunks of 25 to avoid URL length limits
  const BATCH_SIZE = 25;
  const batches: number[][] = [];
  for (let i = 0; i < playerIds.length; i += BATCH_SIZE) {
    batches.push(playerIds.slice(i, i + BATCH_SIZE));
  }

  console.log(`  👥 Filtering by ${playerIds.length} player IDs (${batches.length} batches)`);

  const allResults: ApiAdvancedSeasonAverage[] = [];

  // Fetch each batch
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i]!;
    console.log(`  📦 Batch ${i + 1}/${batches.length}: ${batch.length} players`);

    const batchParams = {
      ...params,
      player_ids: batch,
    };

    const response = await fetchFromAPI(
      '/season_averages/clutch',
      z.object({ data: z.array(AdvancedSeasonAverageSchema) }),
      batchParams
    );

    // Filter to only include entries with player.id and season (required for our use case)
    const validResults = response.data.filter(
      avg => 
        avg.player?.id !== undefined && 
        avg.player?.id !== null && 
        avg.season !== undefined && 
        avg.season !== null
    );
    
    if (validResults.length < response.data.length) {
      console.log(`    ⚠️  Filtered out ${response.data.length - validResults.length} entries missing player.id or season`);
    }
    
    allResults.push(...validResults);

    // Throttle between batches to respect rate limits
    if (i < batches.length - 1) {
      await throttle();
    }
  }

  console.log(`  ✅ Fetched ${allResults.length} valid advanced clutch season averages from ${batches.length} batches`);
  return allResults;
}

/**
 * Fetch advanced season averages for general/advanced stats
 * Category: general, Type: advanced
 * Can filter by player_ids array for efficiency
 * Batches player_ids into chunks of 25 to avoid URL length limits
 */
export async function fetchAdvancedSeasonAverages(
  season: number,
  seasonType: string = 'regular',
  playerIds?: number[]
): Promise<ApiAdvancedSeasonAverage[]> {
  console.log(`📊 Fetching advanced season averages (general/advanced) for season ${season}...`);
  
  const params: Record<string, any> = {
    season,
    season_type: seasonType,
    type: 'advanced',
  };

  // If no player IDs provided, fetch all (not recommended)
  if (!playerIds || playerIds.length === 0) {
    console.log(`  ⚠️  No player IDs provided, fetching all advanced season averages`);
    const response = await fetchFromAPI(
      '/season_averages/general',
      z.object({ data: z.array(AdvancedSeasonAverageSchema) }),
      params
    );
    return response.data.filter(avg => avg.player?.id !== undefined && avg.player?.id !== null);
  }

  // Batch player IDs into chunks of 25 to avoid URL length limits
  const BATCH_SIZE = 25;
  const batches: number[][] = [];
  for (let i = 0; i < playerIds.length; i += BATCH_SIZE) {
    batches.push(playerIds.slice(i, i + BATCH_SIZE));
  }

  console.log(`  👥 Filtering by ${playerIds.length} player IDs (${batches.length} batches)`);

  const allResults: ApiAdvancedSeasonAverage[] = [];

  // Fetch each batch
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i]!;
    console.log(`  📦 Batch ${i + 1}/${batches.length}: ${batch.length} players`);

    const batchParams = {
      ...params,
      player_ids: batch,
    };

    const response = await fetchFromAPI(
      '/season_averages/general',
      z.object({ data: z.array(AdvancedSeasonAverageSchema) }),
      batchParams
    );

    // Filter to only include entries with player.id and season (required for our use case)
    const validResults = response.data.filter(
      avg => 
        avg.player?.id !== undefined && 
        avg.player?.id !== null && 
        avg.season !== undefined && 
        avg.season !== null
    );
    
    if (validResults.length < response.data.length) {
      console.log(`    ⚠️  Filtered out ${response.data.length - validResults.length} entries missing player.id or season`);
    }
    
    allResults.push(...validResults);

    // Throttle between batches to respect rate limits
    if (i < batches.length - 1) {
      await throttle();
    }
  }

  console.log(`  ✅ Fetched ${allResults.length} valid advanced season averages from ${batches.length} batches`);
  return allResults;
}

/**
 * Fetch team contracts for a specific team and season
 * Endpoint: GET /contracts/teams
 */
export async function fetchTeamContracts(
  teamId: number,
  season?: number
): Promise<ApiContract[]> {
  console.log(`💰 Fetching contracts for team ${teamId}${season ? `, season ${season}` : ''}...`);

  const params: Record<string, any> = {
    team_id: teamId,
  };

  if (season !== undefined) {
    params.season = season;
  }

  const response = await fetchFromAPI(
    '/contracts/teams',
    z.object({ data: z.array(ContractSchema) }),
    params
  );

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

/**
 * Fetch historical season averages for all players in a season
 * Uses the /nba/v1/season_averages/general endpoint
 * Handles cursor-based pagination automatically
 */
export async function fetchHistoricalSeasonAverages(
  season: number,
  seasonType: string = 'regular',
  perPage: number = 100
): Promise<ApiSeasonAverage[]> {
  console.log(`📊 Fetching historical season averages for season ${season} (will be stored as ${season + 1})...`);
  
  const results: ApiSeasonAverage[] = [];
  let cursor: number | null | undefined = undefined;
  let pageCount = 0;

  do {
    const params: Record<string, any> = {
      season,
      season_type: seasonType,
      type: 'base',
      per_page: perPage,
    };

    // Add cursor if we have one (don't include cursor parameter on first request)
    if (cursor !== undefined && cursor !== null) {
      params.cursor = cursor;
    }

    try {
      const response = await fetchFromNBAAPI(
        '/season_averages/general',
        z.object({
          data: z.array(SeasonAverageSchema),
          meta: z.object({
            per_page: z.number(),
            next_cursor: z.number().nullable().optional(),
            total_count: z.number().optional(),
          }),
        }),
        params
      );

      const validAverages = response.data.filter(
        avg => avg.player?.id !== undefined && avg.player?.id !== null
      );
      
      results.push(...validAverages);
      cursor = response.meta.next_cursor ?? null;
      pageCount++;
      
      console.log(`  📄 Request ${pageCount}: ${validAverages.length} items (total: ${results.length})`);

      // Throttle between requests if there's more data
      if (cursor) {
        await throttle();
      }
    } catch (error) {
      console.error(`  ❌ Error fetching request ${pageCount + 1}:`, error);
      throw error;
    }
  } while (cursor !== null && cursor !== undefined);

  console.log(`  ✅ Fetched ${results.length} total historical season averages`);
  return results;
}

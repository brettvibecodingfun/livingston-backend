-- ============================================================================
-- Clustering Feature Test Queries
-- ============================================================================
-- Use these queries to verify the clustering feature is working correctly
-- Run with: npm run docker:db < test-clustering.sql
-- Or: docker-compose exec -T postgres psql -U livingston -d livingston < test-clustering.sql

-- ============================================================================
-- Step 1: Verify Data Availability
-- ============================================================================

-- Check if we have historical season averages data
SELECT 
  'Historical Season Averages' as data_source,
  COUNT(*) as total_records,
  COUNT(DISTINCT age) as unique_ages,
  MIN(age) as min_age,
  MAX(age) as max_age,
  COUNT(DISTINCT player_id) as unique_players,
  COUNT(DISTINCT season) as unique_seasons
FROM historical_season_averages
WHERE games_played >= 20 AND minutes >= 15;

-- Check if we have current season averages data
SELECT 
  'Current Season Averages (2025)' as data_source,
  COUNT(*) as total_records,
  COUNT(DISTINCT age) as unique_ages,
  MIN(age) as min_age,
  MAX(age) as max_age,
  COUNT(DISTINCT player_id) as unique_players
FROM season_averages
WHERE season = 2026 
  AND games_played >= 20 
  AND minutes >= 15;

-- Check data availability by age (ages 19-40)
SELECT 
  age,
  COUNT(*) FILTER (WHERE source = 'historical') as historical_count,
  COUNT(*) FILTER (WHERE source = 'current') as current_count,
  COUNT(*) as total_count
FROM (
  SELECT age, 'historical' as source
  FROM historical_season_averages
  WHERE games_played >= 20 AND minutes >= 15
  UNION ALL
  SELECT age, 'current' as source
  FROM season_averages
  WHERE season = 2026 AND games_played >= 20 AND minutes >= 15
) combined
WHERE age BETWEEN 19 AND 40
GROUP BY age
ORDER BY age;

-- ============================================================================
-- Step 2: Verify Clustering Results (Run AFTER clustering job)
-- ============================================================================

-- Check if clusters were created
SELECT 
  age,
  COUNT(DISTINCT cluster_number) as num_clusters,
  COUNT(*) as total_assignments,
  COUNT(DISTINCT player_id) as unique_players
FROM player_clusters
GROUP BY age
ORDER BY age;

-- Check cluster sizes (should be <= 50 if max_cluster_size is 50)
SELECT 
  age,
  cluster_number,
  COUNT(*) as cluster_size
FROM player_clusters
GROUP BY age, cluster_number
HAVING COUNT(*) > 50  -- This should return 0 rows if splitting works
ORDER BY age, cluster_number;

-- Verify cluster distribution for a specific age (e.g., age 22)
SELECT 
  age,
  cluster_number,
  COUNT(*) as players_in_cluster,
  MIN(season) as earliest_season,
  MAX(season) as latest_season
FROM player_clusters
WHERE age = 22
GROUP BY age, cluster_number
ORDER BY cluster_number;

-- ============================================================================
-- Step 3: Test Use Case - Find Player Comparisons
-- ============================================================================

-- Example: Find Anthony Edwards' cluster at age 22 (if he exists)
-- Replace 'Anthony Edwards' with any player name
SELECT 
  pc.age,
  pc.cluster_number,
  pc.season,
  pc.player_name,
  COALESCE(hsa.points, sa.points) as points,
  COALESCE(hsa.assists, sa.assists) as assists,
  COALESCE(hsa.rebounds, sa.rebounds) as rebounds,
  COALESCE(hsa.fg_pct, sa.fg_pct) as fg_pct,
  COALESCE(hsa.three_pct, sa.three_pct) as three_pct,
  COALESCE(hsa.ft_pct, sa.ft_pct) as ft_pct
FROM player_clusters pc
LEFT JOIN historical_season_averages hsa ON pc.historical_season_average_id = hsa.id
LEFT JOIN season_averages sa ON pc.season_average_id = sa.id
WHERE pc.player_id = (
  SELECT id FROM players WHERE full_name LIKE '%Anthony Edwards%' LIMIT 1
)
AND pc.age = 22
ORDER BY pc.season DESC;

-- Find all players in the same cluster as Anthony Edwards at age 22
WITH target_cluster AS (
  SELECT age, cluster_number
  FROM player_clusters
  WHERE player_id = (SELECT id FROM players WHERE full_name LIKE '%Anthony Edwards%' LIMIT 1)
    AND age = 22
  LIMIT 1
)
SELECT 
  pc.player_name,
  pc.season,
  COALESCE(hsa.points, sa.points) as points,
  COALESCE(hsa.assists, sa.assists) as assists,
  COALESCE(hsa.rebounds, sa.rebounds) as rebounds,
  COALESCE(hsa.fg_pct, sa.fg_pct) as fg_pct,
  COALESCE(hsa.three_pct, sa.three_pct) as three_pct,
  COALESCE(hsa.ft_pct, sa.ft_pct) as ft_pct
FROM player_clusters pc
LEFT JOIN historical_season_averages hsa ON pc.historical_season_average_id = hsa.id
LEFT JOIN season_averages sa ON pc.season_average_id = sa.id
JOIN target_cluster tc ON pc.age = tc.age AND pc.cluster_number = tc.cluster_number
WHERE pc.player_id != (SELECT id FROM players WHERE full_name LIKE '%Anthony Edwards%' LIMIT 1)
ORDER BY COALESCE(hsa.points, sa.points) DESC
LIMIT 10;

-- ============================================================================
-- Step 4: Verify Feature Extraction
-- ============================================================================

-- Check if players have all required features (points, assists, rebounds)
SELECT 
  'Historical' as source,
  COUNT(*) as total_records,
  COUNT(*) FILTER (WHERE points IS NOT NULL AND assists IS NOT NULL AND rebounds IS NOT NULL) as has_all_features,
  COUNT(*) FILTER (WHERE points IS NULL OR assists IS NULL OR rebounds IS NULL) as missing_features
FROM historical_season_averages
WHERE games_played >= 20 AND minutes >= 15 AND age BETWEEN 19 AND 40

UNION ALL

SELECT 
  'Current Season' as source,
  COUNT(*) as total_records,
  COUNT(*) FILTER (WHERE points IS NOT NULL AND assists IS NOT NULL AND rebounds IS NOT NULL) as has_all_features,
  COUNT(*) FILTER (WHERE points IS NULL OR assists IS NULL OR rebounds IS NULL) as missing_features
FROM season_averages
WHERE season = 2026 AND games_played >= 20 AND minutes >= 15 AND age BETWEEN 19 AND 40;

-- ============================================================================
-- Step 5: Check for Data Quality Issues
-- ============================================================================

-- Find ages with very few players (might cause clustering issues)
SELECT 
  age,
  COUNT(*) as player_count
FROM (
  SELECT age FROM historical_season_averages WHERE games_played >= 20 AND minutes >= 15
  UNION ALL
  SELECT age FROM season_averages WHERE season = 2026 AND games_played >= 20 AND minutes >= 15
) combined
WHERE age BETWEEN 19 AND 40
GROUP BY age
HAVING COUNT(*) < 10  -- Ages with fewer than 10 players
ORDER BY age;

-- Check for duplicate cluster assignments (shouldn't happen due to unique constraint)
SELECT 
  player_id,
  season,
  age,
  COUNT(*) as duplicate_count
FROM player_clusters
GROUP BY player_id, season, age
HAVING COUNT(*) > 1;

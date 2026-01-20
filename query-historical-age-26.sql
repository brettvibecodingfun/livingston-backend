-- Query to get all players aged 26 from the 2024 season (stored as 2025)
-- This tests that the historical season averages data was loaded correctly

SELECT 
    hsa.player_name,
    hsa.age,
    hsa.season,
    hsa.games_played,
    hsa.minutes,
    hsa.points,
    hsa.assists,
    hsa.rebounds,
    hsa.steals,
    hsa.blocks,
    hsa.fg_pct,
    hsa.three_pct,
    hsa.ft_pct,
    p.full_name AS player_full_name,
    p.position,
    p.team_id
FROM historical_season_averages hsa
LEFT JOIN players p ON hsa.player_id = p.id
WHERE hsa.season = 2003  -- API season 2024 is stored as 2025
  AND hsa.age = 26
ORDER BY hsa.points DESC NULLS LAST;

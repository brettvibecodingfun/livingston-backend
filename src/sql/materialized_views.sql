 CREATE MATERIALIZED VIEW IF NOT EXISTS season_player_stats AS
SELECT
  p.id AS player_id,
  g.season,
  COUNT(DISTINCT g.id) AS games_played,
  AVG(b.points) AS ppg,
  AVG(b.assists) AS apg,
  AVG(b.rebounds) AS rpg,
  AVG(b.steals) AS spg,
  AVG(b.blocks) AS bpg,
  AVG(b.turnovers) AS tovpg,
  AVG(NULLIF(b.fgm,0)/NULLIF(b.fga,0)) AS fg_pct,
  AVG(NULLIF(b.tpm,0)/NULLIF(b.tpa,0)) AS three_pct,
  AVG(NULLIF(b.ftm,0)/NULLIF(b.fta,0)) AS ft_pct
FROM box_scores b
JOIN games g ON b.game_id = g.id
JOIN players p ON b.player_id = p.id
GROUP BY p.id, g.season;

CREATE UNIQUE INDEX IF NOT EXISTS idx_season_player_stats_unique ON season_player_stats(player_id, season);
CREATE INDEX IF NOT EXISTS idx_season_player_stats_season ON season_player_stats(season);

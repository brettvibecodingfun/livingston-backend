CREATE TABLE "standings" (
  "id" serial PRIMARY KEY,
  "team_id" integer NOT NULL REFERENCES "teams"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
  "season" integer NOT NULL,
  "wins" integer NOT NULL,
  "losses" integer NOT NULL,
  "conference_rank" integer,
  "division_rank" integer,
  "conference_record" text,
  "division_record" text,
  "home_record" text,
  "road_record" text
);

CREATE UNIQUE INDEX "standings_team_season_unique" ON "standings" ("team_id", "season");
CREATE INDEX "standings_team_id_idx" ON "standings" ("team_id");
CREATE INDEX "standings_season_idx" ON "standings" ("season");

CREATE TABLE "team_season_averages" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"season" integer NOT NULL,
	"season_type" text NOT NULL,
	"wins" integer,
	"losses" integer,
	"points" real,
	"fgm" real,
	"fga" real,
	"fg_pct" real,
	"fta" real,
	"ftm" real,
	"ft_pct" real,
	"fg3a" real,
	"fg3m" real,
	"fg3_pct" real,
	"pace" real,
	"efg_pct" real,
	"ts_pct" real,
	"defensive_rating" real,
	"offensive_rating" real,
	"net_rating" real,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "team_season_averages_team_season_unique" UNIQUE("team_id","season","season_type")
);
--> statement-breakpoint
ALTER TABLE "team_season_averages" ADD CONSTRAINT "team_season_averages_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "team_season_averages_team_id_idx" ON "team_season_averages" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "team_season_averages_season_idx" ON "team_season_averages" USING btree ("season");
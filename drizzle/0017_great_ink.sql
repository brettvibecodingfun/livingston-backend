CREATE TABLE "historical_season_averages" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer NOT NULL,
	"player_name" text NOT NULL,
	"season" integer NOT NULL,
	"games_played" integer,
	"minutes" real,
	"points" real,
	"assists" real,
	"rebounds" real,
	"steals" real,
	"blocks" real,
	"turnovers" real,
	"fgm" real,
	"fga" real,
	"fg_pct" real,
	"tpm" real,
	"tpa" real,
	"three_pct" real,
	"ftm" real,
	"fta" real,
	"ft_pct" real,
	"age" integer,
	CONSTRAINT "historical_season_averages_player_season_unique" UNIQUE("player_id","season")
);
--> statement-breakpoint
ALTER TABLE "historical_season_averages" ADD CONSTRAINT "historical_season_averages_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "historical_season_averages_player_id_idx" ON "historical_season_averages" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "historical_season_averages_season_idx" ON "historical_season_averages" USING btree ("season");--> statement-breakpoint
CREATE INDEX "historical_season_averages_player_name_idx" ON "historical_season_averages" USING btree ("player_name");
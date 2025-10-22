CREATE TABLE "box_scores" (
	"id" serial PRIMARY KEY NOT NULL,
	"game_id" integer NOT NULL,
	"player_id" integer NOT NULL,
	"team_id" integer NOT NULL,
	"minutes" real,
	"points" real,
	"assists" real,
	"rebounds" real,
	"steals" real,
	"blocks" real,
	"turnovers" real,
	"fgm" real,
	"fga" real,
	"tpm" real,
	"tpa" real,
	"ftm" real,
	"fta" real,
	CONSTRAINT "box_scores_game_player_unique" UNIQUE("game_id","player_id")
);
--> statement-breakpoint
CREATE TABLE "games" (
	"id" serial PRIMARY KEY NOT NULL,
	"api_id" integer NOT NULL,
	"season" integer NOT NULL,
	"date" date NOT NULL,
	"home_team_id" integer NOT NULL,
	"away_team_id" integer NOT NULL,
	"home_score" integer,
	"away_score" integer,
	CONSTRAINT "games_api_id_unique" UNIQUE("api_id")
);
--> statement-breakpoint
CREATE TABLE "players" (
	"id" serial PRIMARY KEY NOT NULL,
	"api_id" integer NOT NULL,
	"full_name" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"team_id" integer,
	"position" text,
	"height" text,
	"weight" text,
	"birthdate" date,
	CONSTRAINT "players_api_id_unique" UNIQUE("api_id")
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" serial PRIMARY KEY NOT NULL,
	"api_id" integer NOT NULL,
	"name" text NOT NULL,
	"abbreviation" text NOT NULL,
	"city" text NOT NULL,
	"conference" text NOT NULL,
	"division" text NOT NULL,
	CONSTRAINT "teams_api_id_unique" UNIQUE("api_id")
);
--> statement-breakpoint
ALTER TABLE "box_scores" ADD CONSTRAINT "box_scores_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "box_scores" ADD CONSTRAINT "box_scores_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "box_scores" ADD CONSTRAINT "box_scores_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "games" ADD CONSTRAINT "games_home_team_id_teams_id_fk" FOREIGN KEY ("home_team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "games" ADD CONSTRAINT "games_away_team_id_teams_id_fk" FOREIGN KEY ("away_team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "players" ADD CONSTRAINT "players_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "box_scores_game_id_idx" ON "box_scores" USING btree ("game_id");--> statement-breakpoint
CREATE INDEX "box_scores_player_id_idx" ON "box_scores" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "box_scores_team_id_idx" ON "box_scores" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "games_api_id_idx" ON "games" USING btree ("api_id");--> statement-breakpoint
CREATE INDEX "games_season_idx" ON "games" USING btree ("season");--> statement-breakpoint
CREATE INDEX "games_date_idx" ON "games" USING btree ("date");--> statement-breakpoint
CREATE INDEX "games_home_team_id_idx" ON "games" USING btree ("home_team_id");--> statement-breakpoint
CREATE INDEX "games_away_team_id_idx" ON "games" USING btree ("away_team_id");--> statement-breakpoint
CREATE INDEX "players_api_id_idx" ON "players" USING btree ("api_id");--> statement-breakpoint
CREATE INDEX "players_team_id_idx" ON "players" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "players_position_idx" ON "players" USING btree ("position");--> statement-breakpoint
CREATE INDEX "teams_api_id_idx" ON "teams" USING btree ("api_id");
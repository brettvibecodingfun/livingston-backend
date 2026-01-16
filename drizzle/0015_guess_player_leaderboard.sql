CREATE TABLE "guess_player_leaderboard" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_name" text NOT NULL,
	"score" integer NOT NULL,
	"game_date" date NOT NULL,
	"player_id_season" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "guess_player_leaderboard_game_date_idx" ON "guess_player_leaderboard" USING btree ("game_date");--> statement-breakpoint
CREATE INDEX "guess_player_leaderboard_user_name_idx" ON "guess_player_leaderboard" USING btree ("user_name");--> statement-breakpoint
CREATE INDEX "guess_player_leaderboard_score_idx" ON "guess_player_leaderboard" USING btree ("score");--> statement-breakpoint
CREATE INDEX "guess_player_leaderboard_player_id_season_idx" ON "guess_player_leaderboard" USING btree ("player_id_season");

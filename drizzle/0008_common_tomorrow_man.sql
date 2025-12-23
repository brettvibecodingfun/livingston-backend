CREATE TABLE "bogle_games" (
	"game_id" serial PRIMARY KEY NOT NULL,
	"game_date" date NOT NULL,
	"game_question" text NOT NULL,
	CONSTRAINT "bogle_games_game_date_unique" UNIQUE("game_date")
);
--> statement-breakpoint
ALTER TABLE "bogle_scores" DROP CONSTRAINT "bogle_scores_username_date_question_unique";--> statement-breakpoint
ALTER TABLE "bogle_scores" ADD COLUMN "game_id" integer NOT NULL;--> statement-breakpoint
CREATE INDEX "bogle_games_game_date_idx" ON "bogle_games" USING btree ("game_date");--> statement-breakpoint
ALTER TABLE "bogle_scores" ADD CONSTRAINT "bogle_scores_game_id_bogle_games_game_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."bogle_games"("game_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "bogle_scores_game_id_idx" ON "bogle_scores" USING btree ("game_id");--> statement-breakpoint
ALTER TABLE "bogle_scores" ADD CONSTRAINT "bogle_scores_username_game_id_unique" UNIQUE("username","game_id");
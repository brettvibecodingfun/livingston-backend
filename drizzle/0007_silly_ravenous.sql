CREATE TABLE "bogle_scores" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"game_score" integer NOT NULL,
	"game_date" date NOT NULL,
	"game_question" text NOT NULL,
	"time_taken" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bogle_scores_username_date_question_unique" UNIQUE("username","game_date","game_question")
);
--> statement-breakpoint
CREATE INDEX "bogle_scores_game_date_idx" ON "bogle_scores" USING btree ("game_date");--> statement-breakpoint
CREATE INDEX "bogle_scores_username_idx" ON "bogle_scores" USING btree ("username");--> statement-breakpoint
CREATE INDEX "bogle_scores_game_question_idx" ON "bogle_scores" USING btree ("game_question");--> statement-breakpoint
CREATE INDEX "bogle_scores_game_score_idx" ON "bogle_scores" USING btree ("game_score");
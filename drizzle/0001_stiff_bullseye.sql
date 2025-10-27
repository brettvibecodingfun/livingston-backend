CREATE TABLE "leaders" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer NOT NULL,
	"season" integer NOT NULL,
	"stat_type" text NOT NULL,
	"value" real NOT NULL,
	"rank" integer NOT NULL,
	"games_played" integer NOT NULL,
	CONSTRAINT "leaders_player_season_stat_unique" UNIQUE("player_id","season","stat_type")
);
--> statement-breakpoint
ALTER TABLE "leaders" ADD CONSTRAINT "leaders_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "leaders_player_id_idx" ON "leaders" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "leaders_season_idx" ON "leaders" USING btree ("season");--> statement-breakpoint
CREATE INDEX "leaders_stat_type_idx" ON "leaders" USING btree ("stat_type");--> statement-breakpoint
CREATE INDEX "leaders_rank_idx" ON "leaders" USING btree ("rank");
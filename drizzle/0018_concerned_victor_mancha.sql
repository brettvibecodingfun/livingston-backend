CREATE TABLE "player_clusters" (
	"id" serial PRIMARY KEY NOT NULL,
	"age" integer NOT NULL,
	"cluster_number" integer NOT NULL,
	"player_id" integer NOT NULL,
	"season" integer NOT NULL,
	"player_name" text NOT NULL,
	"historical_season_average_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "player_clusters_player_season_age_unique" UNIQUE("player_id","season","age")
);
--> statement-breakpoint
ALTER TABLE "player_clusters" ADD CONSTRAINT "player_clusters_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_clusters" ADD CONSTRAINT "player_clusters_historical_season_average_id_historical_season_averages_id_fk" FOREIGN KEY ("historical_season_average_id") REFERENCES "public"."historical_season_averages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "player_clusters_age_cluster_idx" ON "player_clusters" USING btree ("age","cluster_number");--> statement-breakpoint
CREATE INDEX "player_clusters_player_id_idx" ON "player_clusters" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "player_clusters_season_idx" ON "player_clusters" USING btree ("season");--> statement-breakpoint
CREATE INDEX "player_clusters_age_idx" ON "player_clusters" USING btree ("age");
ALTER TABLE "claude_plays_2048_game_state" DROP CONSTRAINT "claude_plays_2048_game_state_game_id_claude_plays_2048_game_id_fk";
--> statement-breakpoint
ALTER TABLE "claude_plays_2048_game_state" ALTER COLUMN "score" DROP DEFAULT;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "claude_plays_2048_game_state" ADD CONSTRAINT "claude_plays_2048_game_state_game_id_claude_plays_2048_game_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."claude_plays_2048_game"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

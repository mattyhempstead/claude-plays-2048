CREATE TABLE IF NOT EXISTS "claude_plays_2048_game" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "claude_plays_2048_game_state" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"game_id" uuid NOT NULL,
	"board" integer[] NOT NULL,
	"score" integer DEFAULT 0 NOT NULL,
	"move" text
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "claude_plays_2048_game_state" ADD CONSTRAINT "claude_plays_2048_game_state_game_id_claude_plays_2048_game_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."claude_plays_2048_game"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

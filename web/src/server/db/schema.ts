// Example model schema from the Drizzle docs
// https://orm.drizzle.team/docs/sql-schema-declaration

import {
  boolean,
  integer,
  pgTableCreator,
  text,
  timestamp,
  uuid
} from "drizzle-orm/pg-core";

export const createTable = pgTableCreator((name) => `claude_plays_2048_${name}`);

const createdAtField = timestamp("created_at", { withTimezone: true })
  .defaultNow()
  .notNull();

const updatedAtField = timestamp("updated_at", { withTimezone: true })
  .defaultNow()
  .notNull()
  .$onUpdate(() => new Date());

export const game = createTable("game", {
  id: uuid("id").defaultRandom().primaryKey(),
  createdAt: createdAtField,
  updatedAt: updatedAtField,
});

export const gameState = createTable("game_state", {
  id: uuid("id").defaultRandom().primaryKey(),
  createdAt: createdAtField,
  updatedAt: updatedAtField,
  gameId: uuid("game_id").notNull().references(() => game.id, { onDelete: "cascade" }),
  board: integer("board").array().notNull(),
  score: integer("score").notNull(),
  move: text("move", { enum: ["up", "down", "left", "right"] }),
  completed: boolean("completed").notNull(),
});

export const tokenUsage = createTable("token_usage", {
  id: uuid("id").defaultRandom().primaryKey(),
  createdAt: createdAtField,
  updatedAt: updatedAtField,
  model: text("model", { enum: ["claude-3-7-sonnet-latest", "claude-3-5-haiku-latest"] }).notNull(),
  inputTokens: integer("input_tokens").notNull(),
  outputTokens: integer("output_tokens").notNull(),
  cacheCreationInputTokens: integer("cache_creation_input_tokens").notNull(),
  cacheReadInputTokens: integer("cache_read_input_tokens").notNull(),
});

export type GameSelect = typeof game.$inferSelect;
export type GameStateSelect = typeof gameState.$inferSelect;
export type TokenUsageSelect = typeof tokenUsage.$inferSelect;

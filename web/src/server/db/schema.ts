// Example model schema from the Drizzle docs
// https://orm.drizzle.team/docs/sql-schema-declaration

import {
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
  gameId: uuid("game_id").notNull().references(() => game.id),
  board: integer("board").array().notNull(),
  score: integer("score").default(0).notNull(),
  move: text("move", { enum: ["up", "down", "left", "right"] }),
});

export type GameSelect = typeof game.$inferSelect;
export type GameStateSelect = typeof gameState.$inferSelect;

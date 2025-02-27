import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { db } from "@/server/db";
import { game, gameState } from "@/server/db/schema";
import { desc, eq } from "drizzle-orm";

export const gameRouter = createTRPCRouter({
  createGame: publicProcedure
    .mutation(async () => {
      // Create a new game
      const [newGame] = await db
        .insert(game)
        .values({})
        .returning();

      if (!newGame) {
        throw new Error("Failed to create game");
      }
      
      // Create initial board state (16 zeros)
      const initialBoard = Array(16).fill(0);
      
      // Create initial game state
      const [newGameState] = await db
        .insert(gameState)
        .values({
          gameId: newGame.id,
          board: initialBoard,
          score: 0,
          move: null,
        })
        .returning();

      if (!newGameState) {
        throw new Error("Failed to create game state");
      }

      return {
        gameId: newGame.id,
        gameState: newGameState,
      };
    }),

  getGame: publicProcedure
    .input(z.object({ gameId: z.string().uuid() }))
    .query(async ({ input }) => {
      // Get the game
      const [gameData] = await db
        .select()
        .from(game)
        .where(eq(game.id, input.gameId));

      if (!gameData) {
        throw new Error("Game not found");
      }

      // Get the most recent game state
      const [latestGameState] = await db
        .select()
        .from(gameState)
        .where(eq(gameState.gameId, input.gameId))
        .orderBy(desc(gameState.createdAt))
        .limit(1);

      if (!latestGameState) {
        throw new Error("Game state not found");
      }

      return {
        game: gameData,
        gameState: latestGameState,
      };
    }),
});

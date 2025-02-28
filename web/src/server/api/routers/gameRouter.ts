import { z } from "zod";

import { BOARD_SIZE } from "@/lib/constants";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { db } from "@/server/db";
import { game, gameState } from "@/server/db/schema";
import { desc, eq } from "drizzle-orm";

export const gameRouter = createTRPCRouter({
  createGame: publicProcedure
    .input(z.object({
      initialBoard: z.array(z.number()).length(BOARD_SIZE * BOARD_SIZE)
    }))
    .mutation(async ({ input }) => {
      // Create a new game
      const [newGame] = await db
        .insert(game)
        .values({})
        .returning();

      if (!newGame) {
        throw new Error("Failed to create game");
      }
      
      // Use the 1D array directly
      const boardToUse: number[] = input.initialBoard;
      
      // Create initial game state
      const [newGameState] = await db
        .insert(gameState)
        .values({
          gameId: newGame.id,
          board: boardToUse,
          score: 0,
          move: null,
          completed: false,
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

  updateGameState: publicProcedure
    .input(z.object({
      gameId: z.string().uuid(),
      board: z.array(z.number()).length(BOARD_SIZE * BOARD_SIZE),
      score: z.number(),
      move: z.enum(["up", "down", "left", "right"]),
      completed: z.boolean(),
    }))
    .mutation(async ({ input }) => {
      // Check if game exists
      const [gameData] = await db
        .select()
        .from(game)
        .where(eq(game.id, input.gameId));

      if (!gameData) {
        throw new Error("Game not found");
      }

      // Insert new game state
      const [newGameState] = await db
        .insert(gameState)
        .values({
          gameId: input.gameId,
          board: input.board,
          score: input.score,
          move: input.move,
          completed: input.completed,
        })
        .returning();

      if (!newGameState) {
        throw new Error("Failed to update game state");
      }

      return {
        gameState: newGameState,
      };
    }),
});

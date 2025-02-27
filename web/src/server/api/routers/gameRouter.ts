import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { db } from "@/server/db";
import { game, gameState } from "@/server/db/schema";
import { desc, eq } from "drizzle-orm";

export const gameRouter = createTRPCRouter({
  createGame: publicProcedure
    .input(z.object({
      initialBoard: z.array(z.array(z.number())).refine(
        board => board.flat().length === 16,
        { message: "Board must contain exactly 16 elements (4x4 grid)" }
      )
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
      
      // Flatten the 2D array to 1D for storage
      const boardToUse: number[] = input.initialBoard.flat();
      
      // Create initial game state
      const [newGameState] = await db
        .insert(gameState)
        .values({
          gameId: newGame.id,
          board: boardToUse,
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

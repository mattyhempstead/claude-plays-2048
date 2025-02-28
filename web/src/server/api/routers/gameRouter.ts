import { z } from "zod";

import { BOARD_SIZE } from "@/lib/constants";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { db } from "@/server/db";
import { game, gameState, tokenUsage } from "@/server/db/schema";
import { desc, eq, isNotNull, sum } from "drizzle-orm";

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

  getGameStats: publicProcedure
    .query(async () => {
      // Get count of completed games
      const completedGames = await db
        .select({
          gameId: gameState.gameId
        })
        .from(gameState)
        .where(eq(gameState.completed, true))
        .groupBy(gameState.gameId);

      // Get scores of completed games, ordered from highest to lowest
      const completedGameScores = await db
        .select({
          score: gameState.score
        })
        .from(gameState)
        .where(eq(gameState.completed, true))
        .orderBy(desc(gameState.score));

      // Extract just the score values into an array
      const gameScores = completedGameScores.map(game => game.score);

      // Get highest pieces reached in completed games
      const completedGameStates = await db
        .select({
          gameId: gameState.gameId,
          board: gameState.board
        })
        .from(gameState)
        .where(eq(gameState.completed, true));

      // Calculate highest piece for each completed game
      const highestPieces = completedGameStates.map(state => {
        // Find the maximum value in the board array
        return Math.max(...state.board);
      });

      // Count all moves by direction
      const allMoves = await db
        .select({
          move: gameState.move
        })
        .from(gameState)
        .where(
          // Only include records with a valid move (not null)
          isNotNull(gameState.move)
        );

      // Calculate move frequencies
      const moveFrequencies = {
        up: 0,
        down: 0,
        left: 0,
        right: 0
      };

      allMoves.forEach(record => {
        if (record.move) {
          moveFrequencies[record.move]++;
        }
      });

      // Get token usage statistics for the sonnet model
      const [tokenStats] = await db
        .select({
          inputTokens: sum(tokenUsage.inputTokens).mapWith(Number),
          outputTokens: sum(tokenUsage.outputTokens).mapWith(Number)
        })
        .from(tokenUsage)
        .where(eq(tokenUsage.model, "claude-3-7-sonnet-latest"));

      return {
        gameCompletedCount: completedGames.length,
        gameScores,
        highestPieces,
        moveFrequencies,
        tokenStats: {
          inputTokens: tokenStats?.inputTokens ?? 0,
          outputTokens: tokenStats?.outputTokens ?? 0
        }
      };
    }),
});

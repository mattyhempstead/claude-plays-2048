"use client";

import { BOARD_SIZE } from "@/lib/constants";
import { api } from "@/trpc/react";
import { useState } from "react";

export const useGame = () => {
  const [board, setBoard] = useState<number[][]>([]);
  const [score, setScore] = useState<number>(0);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [won, setWon] = useState<boolean>(false);
  const [gameId, setGameId] = useState<string | null>(null);

  const createGameMutation = api.game.createGame.useMutation();
  const updateGameStateMutation = api.game.updateGameState.useMutation();

  // Helper functions to safely get and set board values
  const getBoardValue = ({
    board,
    row,
    col
  }: {
    board: number[][];
    row: number;
    col: number;
  }): number => {
    if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE || !board[row]) {
      return 0;
    }
    return board[row][col] ?? 0;
  };

  const setBoardValue = ({
    board,
    row,
    col,
    value
  }: {
    board: number[][];
    row: number;
    col: number;
    value: number;
  }): void => {
    if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE || !board[row]) {
      return;
    }
    board[row][col] = value;
  };

  const initializeGame = async () => {
    // Create empty board
    const newBoard = Array(BOARD_SIZE)
      .fill(0)
      .map(() => Array(BOARD_SIZE).fill(0));
    
    // Add two initial tiles
    addRandomTile({ currentBoard: newBoard });
    addRandomTile({ currentBoard: newBoard });
    
    // Convert 2D board to 1D array for API
    const flatBoard = newBoard.flat();
    
    try {
      // Call the createGame API
      const result = await createGameMutation.mutateAsync({
        initialBoard: flatBoard,
      });
      
      // Store the game ID
      setGameId(result.gameId);
      
      // Update local state
      setBoard(newBoard);
      setScore(0);
      setGameOver(false);
      setWon(false);
    } catch (error) {
      console.error("Failed to create game:", error);
      
      // Still update local state even if API fails
      setBoard(newBoard);
      setScore(0);
      setGameOver(false);
      setWon(false);
    }
  };

  const addRandomTile = ({
    currentBoard
  }: {
    currentBoard: number[][];
  }) => {
    const emptyCells: [number, number][] = [];
    
    // Find all empty cells
    for (let i = 0; i < BOARD_SIZE; i++) {
      for (let j = 0; j < BOARD_SIZE; j++) {
        if (getBoardValue({ board: currentBoard, row: i, col: j }) === 0) {
          emptyCells.push([i, j]);
        }
      }
    }
    
    if (emptyCells.length === 0) return;
    
    // Choose a random empty cell
    const randomIndex = Math.floor(Math.random() * emptyCells.length);
    const position = emptyCells[randomIndex];
    
    if (!position) return;
    
    const [row, col] = position;
    
    // Place a 2 (90% chance) or 4 (10% chance)
    const value = Math.random() < 0.9 ? 2 : 4;
    setBoardValue({ board: currentBoard, row, col, value });
  };

  const checkGameOver = ({
    currentBoard
  }: {
    currentBoard: number[][];
  }): boolean => {
    // Check if there are any empty cells
    for (let i = 0; i < BOARD_SIZE; i++) {
      for (let j = 0; j < BOARD_SIZE; j++) {
        if (getBoardValue({ board: currentBoard, row: i, col: j }) === 0) return false;
      }
    }
    
    // Check if there are any possible merges horizontally
    for (let i = 0; i < BOARD_SIZE; i++) {
      for (let j = 0; j < BOARD_SIZE - 1; j++) {
        const current = getBoardValue({ board: currentBoard, row: i, col: j });
        const next = getBoardValue({ board: currentBoard, row: i, col: j + 1 });
        if (current === next) return false;
      }
    }
    
    // Check if there are any possible merges vertically
    for (let i = 0; i < BOARD_SIZE - 1; i++) {
      for (let j = 0; j < BOARD_SIZE; j++) {
        const current = getBoardValue({ board: currentBoard, row: i, col: j });
        const below = getBoardValue({ board: currentBoard, row: i + 1, col: j });
        if (current === below) return false;
      }
    }
    
    return true;
  };

  const checkWin = ({
    currentBoard
  }: {
    currentBoard: number[][];
  }): boolean => {
    for (let i = 0; i < BOARD_SIZE; i++) {
      for (let j = 0; j < BOARD_SIZE; j++) {
        if (getBoardValue({ board: currentBoard, row: i, col: j }) === 2048) return true;
      }
    }
    return false;
  };

  const move = (direction: "up" | "down" | "left" | "right") => {
    const newBoard = JSON.parse(JSON.stringify(board));
    let moved = false;
    let newScore = score;
    
    if (direction === "left") {
      for (let i = 0; i < BOARD_SIZE; i++) {
        // Merge tiles
        for (let j = 1; j < BOARD_SIZE; j++) {
          if (getBoardValue({ board: newBoard, row: i, col: j }) !== 0) {
            let k = j;
            while (k > 0 && getBoardValue({ board: newBoard, row: i, col: k - 1 }) === 0) {
              const currentValue = getBoardValue({ board: newBoard, row: i, col: k });
              setBoardValue({ board: newBoard, row: i, col: k - 1, value: currentValue });
              setBoardValue({ board: newBoard, row: i, col: k, value: 0 });
              k--;
              moved = true;
            }
            
            if (k > 0) {
              const prevValue = getBoardValue({ board: newBoard, row: i, col: k - 1 });
              const currValue = getBoardValue({ board: newBoard, row: i, col: k });
              
              if (prevValue === currValue) {
                const mergedValue = currValue * 2;
                setBoardValue({ board: newBoard, row: i, col: k - 1, value: mergedValue });
                newScore += mergedValue;
                setBoardValue({ board: newBoard, row: i, col: k, value: 0 });
                moved = true;
              }
            }
          }
        }
      }
    } else if (direction === "right") {
      for (let i = 0; i < BOARD_SIZE; i++) {
        // Merge tiles
        for (let j = BOARD_SIZE - 2; j >= 0; j--) {
          if (getBoardValue({ board: newBoard, row: i, col: j }) !== 0) {
            let k = j;
            while (
              k < BOARD_SIZE - 1 && 
              getBoardValue({ board: newBoard, row: i, col: k + 1 }) === 0
            ) {
              const currentValue = getBoardValue({ board: newBoard, row: i, col: k });
              setBoardValue({ board: newBoard, row: i, col: k + 1, value: currentValue });
              setBoardValue({ board: newBoard, row: i, col: k, value: 0 });
              k++;
              moved = true;
            }
            
            if (k < BOARD_SIZE - 1) {
              const nextValue = getBoardValue({ board: newBoard, row: i, col: k + 1 });
              const currValue = getBoardValue({ board: newBoard, row: i, col: k });
              
              if (nextValue === currValue) {
                const mergedValue = currValue * 2;
                setBoardValue({ board: newBoard, row: i, col: k + 1, value: mergedValue });
                newScore += mergedValue;
                setBoardValue({ board: newBoard, row: i, col: k, value: 0 });
                moved = true;
              }
            }
          }
        }
      }
    } else if (direction === "up") {
      for (let j = 0; j < BOARD_SIZE; j++) {
        // Merge tiles
        for (let i = 1; i < BOARD_SIZE; i++) {
          if (getBoardValue({ board: newBoard, row: i, col: j }) !== 0) {
            let k = i;
            while (
              k > 0 && 
              getBoardValue({ board: newBoard, row: k - 1, col: j }) === 0
            ) {
              const currentValue = getBoardValue({ board: newBoard, row: k, col: j });
              setBoardValue({ board: newBoard, row: k - 1, col: j, value: currentValue });
              setBoardValue({ board: newBoard, row: k, col: j, value: 0 });
              k--;
              moved = true;
            }
            
            if (k > 0) {
              const aboveValue = getBoardValue({ board: newBoard, row: k - 1, col: j });
              const currValue = getBoardValue({ board: newBoard, row: k, col: j });
              
              if (aboveValue === currValue) {
                const mergedValue = currValue * 2;
                setBoardValue({ board: newBoard, row: k - 1, col: j, value: mergedValue });
                newScore += mergedValue;
                setBoardValue({ board: newBoard, row: k, col: j, value: 0 });
                moved = true;
              }
            }
          }
        }
      }
    } else if (direction === "down") {
      for (let j = 0; j < BOARD_SIZE; j++) {
        // Merge tiles
        for (let i = BOARD_SIZE - 2; i >= 0; i--) {
          if (getBoardValue({ board: newBoard, row: i, col: j }) !== 0) {
            let k = i;
            while (
              k < BOARD_SIZE - 1 && 
              getBoardValue({ board: newBoard, row: k + 1, col: j }) === 0
            ) {
              const currentValue = getBoardValue({ board: newBoard, row: k, col: j });
              setBoardValue({ board: newBoard, row: k + 1, col: j, value: currentValue });
              setBoardValue({ board: newBoard, row: k, col: j, value: 0 });
              k++;
              moved = true;
            }
            
            if (k < BOARD_SIZE - 1) {
              const belowValue = getBoardValue({ board: newBoard, row: k + 1, col: j });
              const currValue = getBoardValue({ board: newBoard, row: k, col: j });
              
              if (belowValue === currValue) {
                const mergedValue = currValue * 2;
                setBoardValue({ board: newBoard, row: k + 1, col: j, value: mergedValue });
                newScore += mergedValue;
                setBoardValue({ board: newBoard, row: k, col: j, value: 0 });
                moved = true;
              }
            }
          }
        }
      }
    }
    
    if (moved) {
      addRandomTile({ currentBoard: newBoard });
      setBoard(newBoard);
      setScore(newScore);
      
      // Update game state in the database
      if (gameId) {
        void updateGameStateMutation.mutateAsync({
          gameId,
          board: newBoard.flat(),
          score: newScore,
          move: direction
        });
      }
      
      if (checkWin({ currentBoard: newBoard })) {
        setWon(true);
      }
      
      if (checkGameOver({ currentBoard: newBoard })) {
        setGameOver(true);
      }
    }
  };

  const newGame = () => {
    void initializeGame();
  };

  const continueGame = () => {
    setWon(false);
  };

  return {
    board,
    score,
    gameOver,
    won,
    gameId,
    move,
    newGame,
    continueGame,
  };
};
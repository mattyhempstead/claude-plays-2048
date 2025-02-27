"use client";

import { BOARD_SIZE } from "@/lib/constants";
import { api } from "@/trpc/react";
import { create } from "zustand";

type MoveDirection = "up" | "down" | "left" | "right";

type GameState = {
  board: number[][];
  score: number;
  gameOver: boolean;
  gameId: string | null;
  moveCount: number;
  setBoard: (board: number[][]) => void;
  setScore: (score: number) => void;
  setGameOver: (gameOver: boolean) => void;
  setGameId: (gameId: string | null) => void;
  setMoveCount: (moveCount: number) => void;
  incrementMoveCount: () => void;
};

const useGameStore = create<GameState>((set) => ({
  board: [],
  score: 0,
  gameOver: false,
  gameId: null,
  moveCount: 0,
  setBoard: (board) => set({ board }),
  setScore: (score) => set({ score }),
  setGameOver: (gameOver) => set({ gameOver }),
  setGameId: (gameId) => set({ gameId }),
  setMoveCount: (moveCount) => set({ moveCount }),
  incrementMoveCount: () => set((state) => ({ moveCount: state.moveCount + 1 })),
}));

export const useGame = () => {
  const {
    board,
    score,
    gameOver,
    gameId,
    moveCount,
    setBoard,
    setScore,
    setGameOver,
    setGameId,
    setMoveCount,
    incrementMoveCount
  } = useGameStore();

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
    
    // // Hardcoded board
    // const newBoard = [
    //   [0, 0, 0, 0],
    //   [0, 0, 0, 0],
    //   [0, 0, 0, 0],
    //   [2, 2, 4, 32]
    // ];

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
      setMoveCount(0);
      setGameOver(false);
    } catch (error) {
      console.error("Failed to create game:", error);
      
      // Still update local state even if API fails
      setBoard(newBoard);
      setScore(0);
      setMoveCount(0);
      setGameOver(false);
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

  const move = (direction: "up" | "down" | "left" | "right") => {
    const newBoard = JSON.parse(JSON.stringify(board));
    let moved = false;
    let newScore = score;
    
    if (direction === "left") {
      for (let i = 0; i < BOARD_SIZE; i++) {
        // First, move all tiles to the left (without merging)
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
          }
        }
        
        // Then, merge tiles (only once per move)
        for (let j = 0; j < BOARD_SIZE - 1; j++) {
          const currValue = getBoardValue({ board: newBoard, row: i, col: j });
          const nextValue = getBoardValue({ board: newBoard, row: i, col: j + 1 });
          
          if (currValue !== 0 && currValue === nextValue) {
            const mergedValue = currValue * 2;
            setBoardValue({ board: newBoard, row: i, col: j, value: mergedValue });
            setBoardValue({ board: newBoard, row: i, col: j + 1, value: 0 });
            newScore += mergedValue;
            moved = true;
            
            // Shift remaining tiles to the left
            for (let k = j + 2; k < BOARD_SIZE; k++) {
              const value = getBoardValue({ board: newBoard, row: i, col: k });
              if (value !== 0) {
                setBoardValue({ board: newBoard, row: i, col: k - 1, value });
                setBoardValue({ board: newBoard, row: i, col: k, value: 0 });
              }
            }
          }
        }
      }
    } else if (direction === "right") {
      for (let i = 0; i < BOARD_SIZE; i++) {
        // First, move all tiles to the right (without merging)
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
          }
        }
        
        // Then, merge tiles (only once per move)
        for (let j = BOARD_SIZE - 1; j > 0; j--) {
          const currValue = getBoardValue({ board: newBoard, row: i, col: j });
          const prevValue = getBoardValue({ board: newBoard, row: i, col: j - 1 });
          
          if (currValue !== 0 && currValue === prevValue) {
            const mergedValue = currValue * 2;
            setBoardValue({ board: newBoard, row: i, col: j, value: mergedValue });
            setBoardValue({ board: newBoard, row: i, col: j - 1, value: 0 });
            newScore += mergedValue;
            moved = true;
            
            // Shift remaining tiles to the right
            for (let k = j - 2; k >= 0; k--) {
              const value = getBoardValue({ board: newBoard, row: i, col: k });
              if (value !== 0) {
                setBoardValue({ board: newBoard, row: i, col: k + 1, value });
                setBoardValue({ board: newBoard, row: i, col: k, value: 0 });
              }
            }
          }
        }
      }
    } else if (direction === "up") {
      for (let j = 0; j < BOARD_SIZE; j++) {
        // First, move all tiles up (without merging)
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
          }
        }
        
        // Then, merge tiles (only once per move)
        for (let i = 0; i < BOARD_SIZE - 1; i++) {
          const currValue = getBoardValue({ board: newBoard, row: i, col: j });
          const nextValue = getBoardValue({ board: newBoard, row: i + 1, col: j });
          
          if (currValue !== 0 && currValue === nextValue) {
            const mergedValue = currValue * 2;
            setBoardValue({ board: newBoard, row: i, col: j, value: mergedValue });
            setBoardValue({ board: newBoard, row: i + 1, col: j, value: 0 });
            newScore += mergedValue;
            moved = true;
            
            // Shift remaining tiles up
            for (let k = i + 2; k < BOARD_SIZE; k++) {
              const value = getBoardValue({ board: newBoard, row: k, col: j });
              if (value !== 0) {
                setBoardValue({ board: newBoard, row: k - 1, col: j, value });
                setBoardValue({ board: newBoard, row: k, col: j, value: 0 });
              }
            }
          }
        }
      }
    } else if (direction === "down") {
      for (let j = 0; j < BOARD_SIZE; j++) {
        // First, move all tiles down (without merging)
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
          }
        }
        
        // Then, merge tiles (only once per move)
        for (let i = BOARD_SIZE - 1; i > 0; i--) {
          const currValue = getBoardValue({ board: newBoard, row: i, col: j });
          const prevValue = getBoardValue({ board: newBoard, row: i - 1, col: j });
          
          if (currValue !== 0 && currValue === prevValue) {
            const mergedValue = currValue * 2;
            setBoardValue({ board: newBoard, row: i, col: j, value: mergedValue });
            setBoardValue({ board: newBoard, row: i - 1, col: j, value: 0 });
            newScore += mergedValue;
            moved = true;
            
            // Shift remaining tiles down
            for (let k = i - 2; k >= 0; k--) {
              const value = getBoardValue({ board: newBoard, row: k, col: j });
              if (value !== 0) {
                setBoardValue({ board: newBoard, row: k + 1, col: j, value });
                setBoardValue({ board: newBoard, row: k, col: j, value: 0 });
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
      incrementMoveCount();
      
      // Update game state in the database
      if (gameId) {
        // This is sometimes out of order based on race condition of the game state
        // We should use a counter probably, or queue them outgoing
        void updateGameStateMutation.mutateAsync({
          gameId,
          board: newBoard.flat(),
          score: newScore,
          move: direction
        });
      }
      
      if (checkGameOver({ currentBoard: newBoard })) {
        setGameOver(true);
      }
    }
  };

  const newGame = () => {
    void initializeGame();
  };

  return {
    board,
    score,
    gameOver,
    gameId,
    moveCount,
    move,
    newGame,
  };
};

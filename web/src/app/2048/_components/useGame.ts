"use client";

import { useEffect, useState } from "react";

export const useGame = () => {
  const [board, setBoard] = useState<number[][]>([]);
  const [score, setScore] = useState<number>(0);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [won, setWon] = useState<boolean>(false);

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
    if (row < 0 || row >= 4 || col < 0 || col >= 4 || !board[row]) {
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
    if (row < 0 || row >= 4 || col < 0 || col >= 4 || !board[row]) {
      return;
    }
    board[row][col] = value;
  };

  // Initialize the game
  useEffect(() => {
    initializeGame();
  }, []);

  const initializeGame = () => {
    // Create empty board
    const newBoard = Array(4).fill(0).map(() => Array(4).fill(0));
    
    // Add two initial tiles
    addRandomTile({ currentBoard: newBoard });
    addRandomTile({ currentBoard: newBoard });
    
    setBoard(newBoard);
    setScore(0);
    setGameOver(false);
    setWon(false);
  };

  const addRandomTile = ({
    currentBoard
  }: {
    currentBoard: number[][];
  }) => {
    const emptyCells: [number, number][] = [];
    
    // Find all empty cells
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
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
    setBoardValue({ board: currentBoard, row, col, value: Math.random() < 0.9 ? 2 : 4 });
  };

  const checkGameOver = ({
    currentBoard
  }: {
    currentBoard: number[][];
  }): boolean => {
    // Check if there are any empty cells
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        if (getBoardValue({ board: currentBoard, row: i, col: j }) === 0) return false;
      }
    }
    
    // Check if there are any possible merges horizontally
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 3; j++) {
        if (getBoardValue({ board: currentBoard, row: i, col: j }) === getBoardValue({ board: currentBoard, row: i, col: j + 1 })) return false;
      }
    }
    
    // Check if there are any possible merges vertically
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 4; j++) {
        if (getBoardValue({ board: currentBoard, row: i, col: j }) === getBoardValue({ board: currentBoard, row: i + 1, col: j })) return false;
      }
    }
    
    return true;
  };

  const checkWin = ({
    currentBoard
  }: {
    currentBoard: number[][];
  }): boolean => {
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
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
      for (let i = 0; i < 4; i++) {
        // Merge tiles
        for (let j = 1; j < 4; j++) {
          if (getBoardValue({ board: newBoard, row: i, col: j }) !== 0) {
            let k = j;
            while (k > 0 && getBoardValue({ board: newBoard, row: i, col: k - 1 }) === 0) {
              setBoardValue({ board: newBoard, row: i, col: k - 1, value: getBoardValue({ board: newBoard, row: i, col: k }) });
              setBoardValue({ board: newBoard, row: i, col: k, value: 0 });
              k--;
              moved = true;
            }
            
            if (k > 0 && getBoardValue({ board: newBoard, row: i, col: k - 1 }) === getBoardValue({ board: newBoard, row: i, col: k })) {
              const mergedValue = getBoardValue({ board: newBoard, row: i, col: k }) * 2;
              setBoardValue({ board: newBoard, row: i, col: k - 1, value: mergedValue });
              newScore += mergedValue;
              setBoardValue({ board: newBoard, row: i, col: k, value: 0 });
              moved = true;
            }
          }
        }
      }
    } else if (direction === "right") {
      for (let i = 0; i < 4; i++) {
        // Merge tiles
        for (let j = 2; j >= 0; j--) {
          if (getBoardValue({ board: newBoard, row: i, col: j }) !== 0) {
            let k = j;
            while (k < 3 && getBoardValue({ board: newBoard, row: i, col: k + 1 }) === 0) {
              setBoardValue({ board: newBoard, row: i, col: k + 1, value: getBoardValue({ board: newBoard, row: i, col: k }) });
              setBoardValue({ board: newBoard, row: i, col: k, value: 0 });
              k++;
              moved = true;
            }
            
            if (k < 3 && getBoardValue({ board: newBoard, row: i, col: k + 1 }) === getBoardValue({ board: newBoard, row: i, col: k })) {
              const mergedValue = getBoardValue({ board: newBoard, row: i, col: k }) * 2;
              setBoardValue({ board: newBoard, row: i, col: k + 1, value: mergedValue });
              newScore += mergedValue;
              setBoardValue({ board: newBoard, row: i, col: k, value: 0 });
              moved = true;
            }
          }
        }
      }
    } else if (direction === "up") {
      for (let j = 0; j < 4; j++) {
        // Merge tiles
        for (let i = 1; i < 4; i++) {
          if (getBoardValue({ board: newBoard, row: i, col: j }) !== 0) {
            let k = i;
            while (k > 0 && getBoardValue({ board: newBoard, row: k - 1, col: j }) === 0) {
              setBoardValue({ board: newBoard, row: k - 1, col: j, value: getBoardValue({ board: newBoard, row: k, col: j }) });
              setBoardValue({ board: newBoard, row: k, col: j, value: 0 });
              k--;
              moved = true;
            }
            
            if (k > 0 && getBoardValue({ board: newBoard, row: k - 1, col: j }) === getBoardValue({ board: newBoard, row: k, col: j })) {
              const mergedValue = getBoardValue({ board: newBoard, row: k, col: j }) * 2;
              setBoardValue({ board: newBoard, row: k - 1, col: j, value: mergedValue });
              newScore += mergedValue;
              setBoardValue({ board: newBoard, row: k, col: j, value: 0 });
              moved = true;
            }
          }
        }
      }
    } else if (direction === "down") {
      for (let j = 0; j < 4; j++) {
        // Merge tiles
        for (let i = 2; i >= 0; i--) {
          if (getBoardValue({ board: newBoard, row: i, col: j }) !== 0) {
            let k = i;
            while (k < 3 && getBoardValue({ board: newBoard, row: k + 1, col: j }) === 0) {
              setBoardValue({ board: newBoard, row: k + 1, col: j, value: getBoardValue({ board: newBoard, row: k, col: j }) });
              setBoardValue({ board: newBoard, row: k, col: j, value: 0 });
              k++;
              moved = true;
            }
            
            if (k < 3 && getBoardValue({ board: newBoard, row: k + 1, col: j }) === getBoardValue({ board: newBoard, row: k, col: j })) {
              const mergedValue = getBoardValue({ board: newBoard, row: k, col: j }) * 2;
              setBoardValue({ board: newBoard, row: k + 1, col: j, value: mergedValue });
              newScore += mergedValue;
              setBoardValue({ board: newBoard, row: k, col: j, value: 0 });
              moved = true;
            }
          }
        }
      }
    }
    
    if (moved) {
      addRandomTile({ currentBoard: newBoard });
      setBoard(newBoard);
      setScore(newScore);
      
      if (checkWin({ currentBoard: newBoard })) {
        setWon(true);
      }
      
      if (checkGameOver({ currentBoard: newBoard })) {
        setGameOver(true);
      }
    }
  };

  const newGame = () => {
    initializeGame();
  };

  const continueGame = () => {
    setWon(false);
  };

  return {
    board,
    score,
    gameOver,
    won,
    move,
    newGame,
    continueGame
  };
};
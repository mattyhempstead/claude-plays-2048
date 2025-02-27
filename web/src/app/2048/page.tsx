"use client";

import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";

export default function Page() {
  const [board, setBoard] = useState<number[][]>([]);
  const [score, setScore] = useState<number>(0);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [won, setWon] = useState<boolean>(false);

  // Initialize the game
  useEffect(() => {
    initializeGame();
  }, []);

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameOver) return;
      
      switch (e.key) {
        case "ArrowUp":
          moveUp();
          break;
        case "ArrowDown":
          moveDown();
          break;
        case "ArrowLeft":
          moveLeft();
          break;
        case "ArrowRight":
          moveRight();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [board, gameOver]);

  const initializeGame = () => {
    // Create empty board
    const newBoard = Array(4).fill(0).map(() => Array(4).fill(0));
    
    // Add two initial tiles
    addRandomTile(newBoard);
    addRandomTile(newBoard);
    
    setBoard(newBoard);
    setScore(0);
    setGameOver(false);
    setWon(false);
  };

  const addRandomTile = (currentBoard: number[][]) => {
    const emptyCells: [number, number][] = [];
    
    // Find all empty cells
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        if (currentBoard[i][j] === 0) {
          emptyCells.push([i, j]);
        }
      }
    }
    
    if (emptyCells.length === 0) return;
    
    // Choose a random empty cell
    const [row, col] = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    
    // Place a 2 (90% chance) or 4 (10% chance)
    currentBoard[row][col] = Math.random() < 0.9 ? 2 : 4;
  };

  const checkGameOver = (currentBoard: number[][]) => {
    // Check if there are any empty cells
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        if (currentBoard[i][j] === 0) return false;
      }
    }
    
    // Check if there are any possible merges horizontally
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 3; j++) {
        if (currentBoard[i][j] === currentBoard[i][j + 1]) return false;
      }
    }
    
    // Check if there are any possible merges vertically
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 4; j++) {
        if (currentBoard[i][j] === currentBoard[i + 1][j]) return false;
      }
    }
    
    return true;
  };

  const checkWin = (currentBoard: number[][]) => {
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        if (currentBoard[i][j] === 2048) return true;
      }
    }
    return false;
  };

  const moveLeft = () => {
    const newBoard = JSON.parse(JSON.stringify(board));
    let moved = false;
    let newScore = score;
    
    for (let i = 0; i < 4; i++) {
      // Merge tiles
      for (let j = 1; j < 4; j++) {
        if (newBoard[i][j] !== 0) {
          let k = j;
          while (k > 0 && newBoard[i][k - 1] === 0) {
            newBoard[i][k - 1] = newBoard[i][k];
            newBoard[i][k] = 0;
            k--;
            moved = true;
          }
          
          if (k > 0 && newBoard[i][k - 1] === newBoard[i][k]) {
            newBoard[i][k - 1] *= 2;
            newScore += newBoard[i][k - 1];
            newBoard[i][k] = 0;
            moved = true;
          }
        }
      }
    }
    
    if (moved) {
      addRandomTile(newBoard);
      setBoard(newBoard);
      setScore(newScore);
      
      if (checkWin(newBoard)) {
        setWon(true);
      }
      
      if (checkGameOver(newBoard)) {
        setGameOver(true);
      }
    }
  };

  const moveRight = () => {
    const newBoard = JSON.parse(JSON.stringify(board));
    let moved = false;
    let newScore = score;
    
    for (let i = 0; i < 4; i++) {
      // Merge tiles
      for (let j = 2; j >= 0; j--) {
        if (newBoard[i][j] !== 0) {
          let k = j;
          while (k < 3 && newBoard[i][k + 1] === 0) {
            newBoard[i][k + 1] = newBoard[i][k];
            newBoard[i][k] = 0;
            k++;
            moved = true;
          }
          
          if (k < 3 && newBoard[i][k + 1] === newBoard[i][k]) {
            newBoard[i][k + 1] *= 2;
            newScore += newBoard[i][k + 1];
            newBoard[i][k] = 0;
            moved = true;
          }
        }
      }
    }
    
    if (moved) {
      addRandomTile(newBoard);
      setBoard(newBoard);
      setScore(newScore);
      
      if (checkWin(newBoard)) {
        setWon(true);
      }
      
      if (checkGameOver(newBoard)) {
        setGameOver(true);
      }
    }
  };

  const moveUp = () => {
    const newBoard = JSON.parse(JSON.stringify(board));
    let moved = false;
    let newScore = score;
    
    for (let j = 0; j < 4; j++) {
      // Merge tiles
      for (let i = 1; i < 4; i++) {
        if (newBoard[i][j] !== 0) {
          let k = i;
          while (k > 0 && newBoard[k - 1][j] === 0) {
            newBoard[k - 1][j] = newBoard[k][j];
            newBoard[k][j] = 0;
            k--;
            moved = true;
          }
          
          if (k > 0 && newBoard[k - 1][j] === newBoard[k][j]) {
            newBoard[k - 1][j] *= 2;
            newScore += newBoard[k - 1][j];
            newBoard[k][j] = 0;
            moved = true;
          }
        }
      }
    }
    
    if (moved) {
      addRandomTile(newBoard);
      setBoard(newBoard);
      setScore(newScore);
      
      if (checkWin(newBoard)) {
        setWon(true);
      }
      
      if (checkGameOver(newBoard)) {
        setGameOver(true);
      }
    }
  };

  const moveDown = () => {
    const newBoard = JSON.parse(JSON.stringify(board));
    let moved = false;
    let newScore = score;
    
    for (let j = 0; j < 4; j++) {
      // Merge tiles
      for (let i = 2; i >= 0; i--) {
        if (newBoard[i][j] !== 0) {
          let k = i;
          while (k < 3 && newBoard[k + 1][j] === 0) {
            newBoard[k + 1][j] = newBoard[k][j];
            newBoard[k][j] = 0;
            k++;
            moved = true;
          }
          
          if (k < 3 && newBoard[k + 1][j] === newBoard[k][j]) {
            newBoard[k + 1][j] *= 2;
            newScore += newBoard[k + 1][j];
            newBoard[k][j] = 0;
            moved = true;
          }
        }
      }
    }
    
    if (moved) {
      addRandomTile(newBoard);
      setBoard(newBoard);
      setScore(newScore);
      
      if (checkWin(newBoard)) {
        setWon(true);
      }
      
      if (checkGameOver(newBoard)) {
        setGameOver(true);
      }
    }
  };

  // Get tile background color based on value
  const getTileColor = (value: number) => {
    const colors: Record<number, string> = {
      0: "bg-gray-200",
      2: "bg-yellow-100 text-gray-800",
      4: "bg-yellow-200 text-gray-800",
      8: "bg-yellow-300 text-white",
      16: "bg-yellow-400 text-white",
      32: "bg-orange-300 text-white",
      64: "bg-orange-400 text-white",
      128: "bg-orange-500 text-white",
      256: "bg-red-400 text-white",
      512: "bg-red-500 text-white",
      1024: "bg-red-600 text-white",
      2048: "bg-yellow-500 text-white",
    };
    
    return colors[value] || "bg-purple-600 text-white";
  };

  // Get font size based on value
  const getFontSize = (value: number) => {
    if (value < 100) return "text-2xl";
    if (value < 1000) return "text-xl";
    return "text-lg";
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100">
      <h1 className="mb-4 text-4xl font-bold">2048</h1>
      
      <div className="mb-4 flex items-center justify-between w-72">
        <div className="rounded-md bg-gray-300 p-2">
          <div className="text-sm text-gray-700">Score</div>
          <div className="font-bold text-xl">{score}</div>
        </div>
        
        <button 
          onClick={initializeGame}
          className="flex items-center gap-1 rounded-md bg-gray-300 px-3 py-2 hover:bg-gray-400"
        >
          <RotateCcw size={16} />
          <span>New Game</span>
        </button>
      </div>
      
      <div className="grid grid-cols-4 gap-4 rounded-lg bg-gray-300 p-4 mb-4">
        {board.flat().map((value, i) => (
          <div
            key={i}
            className={`flex h-16 w-16 items-center justify-center rounded-lg ${getTileColor(value)} ${getFontSize(value)} font-bold transition-all duration-100`}
          >
            {value !== 0 && value}
          </div>
        ))}
      </div>
      
      {/* Mobile controls */}
      <div className="md:hidden grid grid-cols-3 gap-2 mt-4">
        <div></div>
        <button 
          onClick={moveUp}
          className="flex items-center justify-center p-4 bg-gray-300 rounded-md"
          aria-label="Move Up"
        >
          <ArrowUp />
        </button>
        <div></div>
        
        <button 
          onClick={moveLeft}
          className="flex items-center justify-center p-4 bg-gray-300 rounded-md"
          aria-label="Move Left"
        >
          <ArrowLeft />
        </button>
        
        <button 
          onClick={moveDown}
          className="flex items-center justify-center p-4 bg-gray-300 rounded-md"
          aria-label="Move Down"
        >
          <ArrowDown />
        </button>
        
        <button 
          onClick={moveRight}
          className="flex items-center justify-center p-4 bg-gray-300 rounded-md"
          aria-label="Move Right"
        >
          <ArrowRight />
        </button>
      </div>
      
      {/* Game over overlay */}
      {gameOver && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="rounded-lg bg-white p-8 text-center">
            <h2 className="mb-4 text-2xl font-bold">Game Over!</h2>
            <p className="mb-4">Your score: {score}</p>
            <button
              onClick={initializeGame}
              className="rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
            >
              Play Again
            </button>
          </div>
        </div>
      )}
      
      {/* Win overlay */}
      {won && !gameOver && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="rounded-lg bg-white p-8 text-center">
            <h2 className="mb-4 text-2xl font-bold">You Win!</h2>
            <p className="mb-4">Your score: {score}</p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => setWon(false)}
                className="rounded-md bg-green-500 px-4 py-2 text-white hover:bg-green-600"
              >
                Continue
              </button>
              <button
                onClick={initializeGame}
                className="rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
              >
                New Game
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="mt-8 text-center text-gray-600">
        <p>Use arrow keys to move tiles. Combine same numbers to get to 2048!</p>
      </div>
    </div>
  );
}

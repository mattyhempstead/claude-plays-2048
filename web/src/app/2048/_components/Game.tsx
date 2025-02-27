"use client";

import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, RotateCcw } from "lucide-react";
import { useEffect } from "react";
import { useGame } from "./useGame";

export const Game = () => {
  const {
    board,
    score,
    gameOver,
    won,
    gameId,
    move,
    newGame,
    continueGame,
  } = useGame();

  // Initialize game on mount
  // useEffect(() => {
  //   void initializeGame();
  // }, [initializeGame]);

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameOver) return;
      
      switch (e.key) {
        case "ArrowUp":
          move("up");
          break;
        case "ArrowDown":
          move("down");
          break;
        case "ArrowLeft":
          move("left");
          break;
        case "ArrowRight":
          move("right");
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameOver, move]);

  return (
    <>
      <h1 className="mb-4 text-4xl font-bold">2048</h1>
      
      <div className="mb-4 flex items-center justify-between w-72">
        <div className="rounded-md bg-gray-300 p-2">
          <div className="text-sm text-gray-700">Score</div>
          <div className="font-bold text-xl">{score}</div>
        </div>
        
        <button 
          onClick={newGame}
          className="flex items-center gap-1 rounded-md bg-gray-300 px-3 py-2 hover:bg-gray-400"
        >
          <RotateCcw size={16} />
          <span>New Game</span>
        </button>
      </div>
      
      <GameBoard board={board} />
      
      {/* Control buttons */}
      <div className="grid grid-cols-3 gap-2 mt-4">
        <div></div>
        <button 
          onClick={() => move("up")}
          className="flex items-center justify-center p-4 bg-gray-300 rounded-md"
          aria-label="Move Up"
        >
          <ArrowUp />
        </button>
        <div></div>
        
        <button 
          onClick={() => move("left")}
          className="flex items-center justify-center p-4 bg-gray-300 rounded-md"
          aria-label="Move Left"
        >
          <ArrowLeft />
        </button>
        
        <button 
          onClick={() => move("down")}
          className="flex items-center justify-center p-4 bg-gray-300 rounded-md"
          aria-label="Move Down"
        >
          <ArrowDown />
        </button>
        
        <button 
          onClick={() => move("right")}
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
              onClick={newGame}
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
                onClick={continueGame}
                className="rounded-md bg-green-500 px-4 py-2 text-white hover:bg-green-600"
              >
                Continue
              </button>
              <button
                onClick={newGame}
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
        {gameId && (
          <p className="mt-2 text-xs text-gray-500">Game ID: {gameId}</p>
        )}
      </div>
    </>
  );
};

const GameBoard = ({
  board
}: {
  board: number[][];
}) => {
  // Get tile background color based on value
  const getTileColor = ({
    value
  }: {
    value: number;
  }): string => {
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
  const getFontSize = ({
    value
  }: {
    value: number;
  }): string => {
    if (value < 100) return "text-2xl";
    if (value < 1000) return "text-xl";
    return "text-lg";
  };

  return (
    <div className="grid grid-cols-4 gap-4 rounded-lg bg-gray-300 p-4 mb-4">
      {board.flat().map((value, i) => (
        <div
          key={i}
          className={`flex h-16 w-16 items-center justify-center rounded-lg ${getTileColor({ value })} ${getFontSize({ value })} font-bold transition-all duration-100`}
        >
          {value !== 0 && value}
        </div>
      ))}
    </div>
  );
};
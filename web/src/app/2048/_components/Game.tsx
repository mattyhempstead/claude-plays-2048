"use client";

import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Play, RotateCcw } from "lucide-react";
import { useEffect, useRef } from "react";
import { useClaude } from "./useClaude";
import { useGame } from "./useGame";

export const Game = () => {
  const {
    board,
    score,
    gameOver,
    gameId,
    move,
    newGame,
  } = useGame();

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
      <h1 className="text-3xl font-bold text-center mb-8">Claude Plays 2048</h1>
      <div className="flex flex-col md:flex-row gap-8 w-full max-w-6xl">
        {/* Claude Response Section */}
        <ClaudeAnalysis board={board} move={move} gameOver={gameOver} />
        
        {/* Game Section */}
        <div className="flex-1 flex flex-col items-center">
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
          <GamePad move={move} />
          
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
          
          <div className="mt-8 text-center text-gray-600">
            <p>Use arrow keys to move tiles. Combine same numbers to get to 2048!</p>
            {gameId && (
              <p className="mt-2 text-xs text-gray-500">Game ID: {gameId}</p>
            )}
          </div>
        </div>
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

const GamePad = ({
  move
}: {
  move: (direction: "up" | "down" | "left" | "right") => void;
}) => {
  return (
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
  );
};

const ClaudeAnalysis = ({
  board,
  move,
  gameOver
}: {
  board: number[][];
  move: (direction: "up" | "down" | "left" | "right") => void;
  gameOver: boolean;
}) => {
  const responseRef = useRef<HTMLDivElement>(null);
  const { streamedResponse, isLoading, isThinking, generateResponse } = useClaude();
  
  // Auto-scroll to bottom of response container
  useEffect(() => {
    if (responseRef.current) {
      responseRef.current.scrollTop = responseRef.current.scrollHeight;
    }
  }, [streamedResponse]);

  const handleAIMove = async () => {
    // Convert 2D board to 1D array for Claude
    const flatBoard = board.flat();
    const result = await generateResponse(flatBoard);
    
    if (result.move) {
      move(result.move);
    }
  };

  return (
    <div className="flex-1 min-w-0">
      <h2 className="mb-4 text-2xl font-bold">Claude&apos;s Analysis</h2>
      
      <div 
        ref={responseRef}
        className="h-[500px] overflow-y-auto rounded-md border border-gray-300 bg-gray-50 p-4 font-mono whitespace-pre-wrap mb-4"
      >
        {streamedResponse || (
          <div className="text-gray-500">
            Claude will analyze your game when you click &quot;Play AI Move&quot;
          </div>
        )}
      </div>
      
      <button 
        onClick={handleAIMove}
        disabled={isLoading || gameOver}
        className={`flex items-center gap-2 rounded-md px-4 py-2 ${
          isThinking 
            ? 'bg-amber-600 hover:bg-amber-700 text-white' 
            : 'bg-blue-500 hover:bg-blue-600 text-white'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {isLoading || isThinking ? (
          <>
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            {isThinking ? "Claude is thinking..." : "Generating..."}
          </>
        ) : (
          <>
            <Play size={16} />
            <span>Play AI Move</span>
          </>
        )}
      </button>
    </div>
  );
};
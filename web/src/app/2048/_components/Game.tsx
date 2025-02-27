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
      <h1 className="text-3xl font-bold text-center mb-12">Claude Plays 2048</h1>

      <div className="flex flex-col md:flex-row gap-8 w-full max-w-6xl">
        {/* Claude Response Section */}
        <ClaudeAnalysis board={board} move={move} gameOver={gameOver} />
        
        {/* Game Section */}
        <div className="flex-1 flex flex-col items-center">
          <div className="mb-4 flex items-center justify-between w-full max-w-96">
            <div className="rounded-md bg-gray-300 p-2 min-w-[100px]">
              <div className="text-sm text-gray-700">Score</div>
              <div className="font-bold text-xl">{score}</div>
            </div>
            
            {/* Control buttons */}
            <GamePad move={move} />
          </div>
          
          <GameBoard board={board} />
        </div>
      </div>

      <div className="mt-4 flex flex-col items-center">
        {gameId && (
          <p className="mb-2 text-xs text-gray-500">Game ID: {gameId}</p>
        )}
        <button 
          onClick={newGame}
          className="flex items-center gap-1 rounded-md bg-gray-300 px-3 py-2 hover:bg-gray-400"
        >
          <RotateCcw size={16} />
          <span>New Game</span>
        </button>
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
    if (value < 100) return "text-3xl";
    if (value < 1000) return "text-2xl";
    return "text-xl";
  };

  return (
    <div className="grid grid-cols-4 gap-4 rounded-lg bg-gray-300 p-6 mb-4">
      {board.flat().map((value, i) => (
        <div
          key={i}
          className={`flex h-20 w-20 items-center justify-center rounded-lg ${getTileColor({ value })} ${getFontSize({ value })} font-bold transition-all duration-100 shadow-md`}
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
    <div className="grid grid-cols-3 gap-1">
      <div></div>
      <button 
        onClick={() => move("up")}
        className="flex items-center justify-center p-2 bg-gray-300 rounded-md"
        aria-label="Move Up"
      >
        <ArrowUp size={16} />
      </button>
      <div></div>
      
      <button 
        onClick={() => move("left")}
        className="flex items-center justify-center p-2 bg-gray-300 rounded-md"
        aria-label="Move Left"
      >
        <ArrowLeft size={16} />
      </button>
      
      <button 
        onClick={() => move("down")}
        className="flex items-center justify-center p-2 bg-gray-300 rounded-md"
        aria-label="Move Down"
      >
        <ArrowDown size={16} />
      </button>
      
      <button 
        onClick={() => move("right")}
        className="flex items-center justify-center p-2 bg-gray-300 rounded-md"
        aria-label="Move Right"
      >
        <ArrowRight size={16} />
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
  const { isLoading, isThinking, isAnswering, isExtractingMove, generateResponse, moveHistory } = useClaude();
  
  // Auto-scroll to bottom of response container
  useEffect(() => {
    if (responseRef.current) {
      responseRef.current.scrollTop = responseRef.current.scrollHeight;
    }
  }, [moveHistory]);

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
        className="h-[500px] overflow-y-auto rounded-md border border-gray-300 bg-gray-50 p-4 font-mono whitespace-pre-wrap mb-4 flex flex-col gap-4"
      >
        {moveHistory.length > 0 && (
          moveHistory.map((item, index) => (
            <div key={index} className="flex flex-col gap-4">
              {item.thinkingResponse && (
                <div>
                  <div className="text-gray-500 font-bold">&lt;THINKING&gt;</div>
                  <div className="whitespace-pre-wrap">{item.thinkingResponse}</div>
                  {!isThinking && <div className="text-gray-500 font-bold">&lt;/THINKING&gt;</div>}
                </div>
              )}
              {item.answerResponse && (
                <div>
                  <div className="text-gray-500 font-bold">&lt;ANSWER&gt;</div>
                  <div className="whitespace-pre-wrap">{item.answerResponse}</div>
                  {!isAnswering && <div className="text-gray-500 font-bold">&lt;/ANSWER&gt;</div>}
                </div>
              )}
              {item.move && (
                <div className="text-green-600 font-bold">
                  <div className="text-gray-500 font-bold">&lt;MOVE&gt;</div>
                  <div>{item.move}</div>
                  <div className="text-gray-500 font-bold">&lt;/MOVE&gt;</div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <button 
        onClick={handleAIMove}
        disabled={isLoading || gameOver}
        className={`flex items-center gap-2 rounded-md px-4 py-2 ${
          isThinking 
            ? 'bg-amber-600 hover:bg-amber-700 text-white' 
            : isAnswering
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : isExtractingMove
                ? 'bg-purple-600 hover:bg-purple-700 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {isLoading ? (
          <>
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            {isThinking 
              ? "Claude is thinking..." 
              : isAnswering 
                ? "Claude is answering..." 
                : isExtractingMove 
                  ? "Extracting move..." 
                  : "Generating..."}
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
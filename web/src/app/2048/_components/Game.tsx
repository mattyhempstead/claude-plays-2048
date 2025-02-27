"use client";

import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, RotateCcw } from "lucide-react";
import { useEffect, useRef } from "react";
import { useClaude } from "./useClaude";
import { useGame } from "./useGame";

export const Game = () => {
  const {
    board,
    score,
    gameOver,
    gameId,
    moveCount,
    move,
    newGame,
  } = useGame();
  
  const { isLoading, generateResponse, isActive, setIsActive } = useClaude();

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


  const handleAIMove = async () => {
    // Convert 2D board to 1D array for Claude
    const result = await generateResponse();
    
    if (result.move) {
      move(result.move);
    }
  };

  // Auto-play effect
  useEffect(() => {
    const autoPlay = async () => {
      if (!isLoading && isActive && !gameOver) {
        await handleAIMove();
      }
    };

    void autoPlay();
  }, [isLoading, isActive, gameOver]);

  const toggleAutoPlay = () => {
    setIsActive(!isActive);
  };

  return (
    <>
      <h1 className="text-3xl font-bold text-center mb-12">Claude Plays 2048</h1>

      <div className="flex flex-col md:flex-row gap-8 w-full max-w-6xl">
        {/* Claude Response Section */}
        <ClaudeAnalysis />
        
        {/* Game Section */}
        <div className="flex-1 flex flex-col items-center">
          <div className="mb-4 flex items-center justify-between w-full max-w-96">
            <div className="rounded-md bg-gray-300 p-2 min-w-[100px]">
              <div className="text-sm text-gray-700">Score</div>
              <div className="font-bold text-xl">{score}</div>
            </div>
            
            <div className="rounded-md bg-gray-300 p-2 min-w-[100px]">
              <div className="text-sm text-gray-700">Move</div>
              <div className="font-bold text-xl">#{moveCount}</div>
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
        <div className="flex gap-2">
          <button 
            onClick={newGame}
            className="flex items-center gap-1 rounded-md bg-gray-300 px-3 py-2 hover:bg-gray-400"
          >
            <RotateCcw size={16} />
            <span>New Game</span>
          </button>
          <button 
            onClick={handleAIMove}
            disabled={isLoading || gameOver}
            className="flex items-center gap-1 rounded-md bg-gray-300 px-3 py-2 hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span>Loading...</span>
            ) : (
              <span>Play Move</span>
            )}
          </button>
          <button 
            onClick={toggleAutoPlay}
            className={`flex items-center gap-1 rounded-md px-3 py-2 ${
              isActive 
                ? 'bg-green-500 hover:bg-green-600 text-white' 
                : 'bg-gray-300 hover:bg-gray-400'
            }`}
          >
            <span>{isActive ? 'Auto-Play: ON' : 'Auto-Play: OFF'}</span>
          </button>
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

const ClaudeAnalysis = () => {
  const responseRef = useRef<HTMLDivElement>(null);
  const { isLoading, isThinking, isAnswering, isExtractingMove, moveHistory } = useClaude();
  
  // Auto-scroll to bottom of response container
  useEffect(() => {
    if (responseRef.current) {
      responseRef.current.scrollTop = responseRef.current.scrollHeight;
    }
  }, [moveHistory]);

  return (
    <div className="flex-1 min-w-0">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Claude&apos;s Analysis</h2>
        {isLoading && (
          <div className={`flex items-center gap-2 px-3 py-1 rounded-md text-white text-sm ${
            isThinking 
              ? 'bg-amber-600' 
              : isAnswering
                ? 'bg-green-600'
                : isExtractingMove
                  ? 'bg-purple-600'
                  : 'bg-blue-500'
          }`}>
            <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
            <span>
              {isThinking 
                ? "Thinking..." 
                : isAnswering 
                  ? "Answering..." 
                  : isExtractingMove 
                    ? "Playing move..." 
                    : "Loading..."}
            </span>
          </div>
        )}
      </div>
      
      <div 
        ref={responseRef}
        className="h-[500px] overflow-y-auto rounded-md border border-gray-300 bg-gray-50 p-4 font-mono whitespace-pre-wrap mb-4"
      >
        <div className="flex flex-col gap-4">
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
      </div>
    </div>
  );
};
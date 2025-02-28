"use client";

import { api } from "@/trpc/react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, RotateCcw } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useClaude } from "./useClaude";
import { useGame } from "./useGame";

const AUTOPLAY_DELAY_MS = 1000;

// Get tile background color based on value
export const getTileColor = (value: number): string => {
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

export const Game = () => {
  const {
    gameOver,
    gameId,
    move,
    newGame,
  } = useGame();
  
  const { isLoading, generateResponse, isActive, setIsActive } = useClaude();
  const [isAutoplayRunning, setIsAutoplayRunning] = useState(false);

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
    if (gameOver) {
      await newGame();
    } else {
      const result = await generateResponse();
      move(result.move);
    }
  };

  // Auto-play effect
  useEffect(() => {
    const autoPlay = async () => {
      if (!isLoading && isActive && !isAutoplayRunning) {
        setIsAutoplayRunning(true);
        await handleAIMove();

        // Wait for 1 second before making the next move
        await new Promise(resolve => setTimeout(resolve, AUTOPLAY_DELAY_MS));
        setIsAutoplayRunning(false);
      }
    };

    void autoPlay();
  }, [isLoading, isActive, isAutoplayRunning]);

  const toggleAutoPlay = () => {
    setIsActive(!isActive);
  };

  return (
    <>
      <div className="flex items-center justify-between max-w-screen-xl mx-auto w-full mb-10">
        <div className="text-base text-gray-500 w-96">
          Inspired by ClaudePlaysPokemon :)
        </div>
        <div className="flex items-center justify-center gap-4">
          <div className="relative flex items-center justify-center">
            <Image 
              src="/anthropic_logo.png" 
              alt="Anthropic Logo" 
              width={100}
              height={100}
              className="h-8 w-auto"
              // className="h-8 w-auto animate-[spin_60s_linear_infinite]"
            />
          </div>
          <h1 className="text-4xl font-extrabold text-center text-amber-600 drop-shadow-sm">
            Claude Plays 2048
          </h1>
        </div>
        <div className="text-lg text-gray-500 hover:text-gray-700 w-96 text-right flex items-center justify-end gap-2">
          <Image 
            src="/twitter_logo.png" 
            alt="Twitter Logo" 
            width={32}
            height={32}
            className="h-6 w-auto"
          />
          <span>@mattyhempstead</span>
        </div>
      </div>

      <div className="flex flex-row gap-4 w-full max-w-screen-xl">
        {/* Claude Response Section */}
        <div className="w-1/2">
          <ClaudeAnalysis />
        </div>

        {/* Game Section */}
        <div className="w-1/2">
          <GameSection />
        </div>
      </div>

      <div className="w-full my-4 max-w-screen-xl">
        <GameStats />
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

const GameSection = () => {
  const {
    board,
    score,
    moveCount,
    gameStartDate,
    previousMove,
    move
  } = useGame();
  
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every second for duration calculation
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col items-center">
      <div className="p-6 bg-gray-50 rounded-lg shadow-sm border border-gray-200 w-full">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1">
            <GameBoard board={board} />
          </div>

          <div className="flex flex-col gap-4 w-28">
            <div className="rounded-md bg-gray-300 p-2">
              <div className="text-sm text-gray-700">Score</div>
              <div className="font-bold text-xl">{score}</div>
            </div>

            <div className="rounded-md bg-gray-300 p-2">
              <div className="text-sm text-gray-700">Moves</div>
              <div className="font-bold text-xl">{moveCount}</div>
            </div>

            <div className="rounded-md bg-gray-300 p-2">
              <div className="text-sm text-gray-700">Duration</div>
              <div className="font-bold text-xl whitespace-nowrap">
                {gameStartDate 
                  ? (() => {
                      const diff = Math.floor((currentTime.getTime() - gameStartDate.getTime()) / 1000);
                      const hours = Math.floor(diff / 3600);
                      const minutes = Math.floor((diff % 3600) / 60);
                      const seconds = diff % 60;
                      
                      if (hours > 0) {
                        return <span className="text-base">{`${hours}h ${minutes}m ${seconds}s`}</span>;
                      } else if (minutes > 0) {
                        return `${minutes}m ${seconds}s`;
                      } else {
                        return `${seconds}s`;
                      }
                    })()
                  : "0s"}
              </div>
            </div>
            
            <div className="rounded-md bg-gray-300 p-2">
              <div className="text-sm text-gray-700">Last move</div>
              <div className="font-bold text-xl">
                {previousMove && (
                  previousMove === "up" ? <ArrowUp className="inline" /> :
                  previousMove === "down" ? <ArrowDown className="inline" /> :
                  previousMove === "left" ? <ArrowLeft className="inline" /> :
                  <ArrowRight className="inline" />
                )}
              </div>
            </div>
            
            {/* Control buttons */}
            {/* <GamePad move={move} /> */}
          </div>
        </div>
      </div>
    </div>
  );
};

const GameBoard = ({
  board
}: {
  board: number[][];
}) => {
  // Get font size based on value
  const getFontSize = (value: number): string => {
    if (value < 100) return "text-4xl";
    if (value < 1000) return "text-2xl";
    return "text-xl";
  };

  return (
    <div className="grid grid-cols-4 gap-4 rounded-lg bg-gray-300 p-4 aspect-square">
      {board.flat().map((value, i) => (
        <div
          key={i}
          className={`flex h-22 w-22 aspect-square items-center justify-center rounded-lg ${getTileColor(value)} ${getFontSize(value)} font-bold transition-all duration-100 shadow-md`}
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
    <div className="p-6 bg-gray-50 rounded-lg shadow-sm border border-gray-200 h-full">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold">Claude&apos;s Analysis</h2>
          <span className="text-sm text-gray-500 ml-1 align-top">(Claude 3.7 Sonnet)</span>
        </div>
        {isLoading && (isThinking || isAnswering || isExtractingMove) && (
          <div className={`flex items-center gap-2 px-3 py-1 rounded-md text-white text-sm ${
            isThinking ? 'bg-amber-600' : 
            isAnswering ? 'bg-green-600' :
            'bg-purple-600'
          }`}>
            <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
            <span>
              {isThinking ? "Thinking..." : 
               isAnswering ? "Answering..." : 
               "Playing move..."}
            </span>
          </div>
        )}
      </div>
      
      <div 
        className="bg-white p-4 rounded-md shadow-sm border border-gray-100"
      >
        <div 
          ref={responseRef}
          className="h-[364px] overflow-y-auto font-mono whitespace-pre-wrap scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <div className="flex flex-col gap-2">
            {moveHistory.length > 0 && (
              moveHistory.map((item, index) => (
                <div key={index} className="flex flex-col gap-2 text-sm">
                  {item.thinkingResponse && (
                    <div>
                      <div className="text-gray-400 text-sm">&lt;THINKING&gt;</div>
                      <div className="whitespace-pre-wrap">{item.thinkingResponse}</div>
                      {!isThinking && <div className="text-gray-400 text-sm">&lt;/THINKING&gt;</div>}
                    </div>
                  )}
                  {item.answerResponse && (
                    <div>
                      <div className="text-gray-400 text-sm">&lt;ANSWER&gt;</div>
                      <div className="whitespace-pre-wrap">{item.answerResponse}</div>
                      {!isAnswering && <div className="text-gray-400 text-sm">&lt;/ANSWER&gt;</div>}
                    </div>
                  )}
                  {item.move && (
                    <div>
                      <div className="text-gray-400 text-sm">&lt;MOVE&gt;</div>
                      <div>{item.move}</div>
                      <div className="text-gray-400 text-sm">&lt;/MOVE&gt;</div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const GameStats = () => {
  const { data: stats } = api.game.getGameStats.useQuery(undefined, {
    refetchInterval: 10000,
  });

  // Get the highest score
  const highestScore = stats?.gameScores?.[0] ?? 0;

  // Get move frequencies
  const moveFrequencies = stats?.moveFrequencies ?? {
    up: 0,
    down: 0,
    left: 0,
    right: 0
  };

  // Calculate total moves for percentage calculation
  const totalMoves = Object.values(moveFrequencies).reduce((sum, count) => sum + count, 0);

  // Calculate percentages
  const getPercentage = (count: number): string => {
    if (totalMoves === 0) return "0%";
    return `${Math.round((count / totalMoves) * 100)}%`;
  };

  // Process highest pieces data
  const highestPieces = stats?.highestPieces ?? [];
  
  // Count occurrences of each piece value
  const pieceCountMap: Record<number, number> = {};
  highestPieces.forEach(piece => {
    pieceCountMap[piece] = (pieceCountMap[piece] || 0) + 1;
  });
  
  // Convert to array, sort by piece value (descending) and take top 3
  const topPieces = Object.entries(pieceCountMap)
    .map(([piece, count]) => ({ piece: Number(piece), count }))
    .sort((a, b) => b.piece - a.piece)
    .slice(0, 3);

  // Get token usage
  const tokenStats = stats?.tokenStats ?? {
    inputTokens: 0,
    outputTokens: 0
  };

  return (
    <div className="p-6 bg-gray-50 rounded-lg shadow-sm border border-gray-200 w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white p-4 rounded-md shadow-sm border border-gray-100 flex flex-col items-center">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Games Completed</h3>
          <p className="font-bold text-2xl text-gray-800">{stats?.gameCompletedCount ?? 0}</p>
        </div>
        
        <div className="bg-white p-4 rounded-md shadow-sm border border-gray-100 flex flex-col items-center">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Highest Score</h3>
          <p className="font-bold text-2xl text-gray-800">{highestScore.toLocaleString()}</p>
        </div>
        
        <div className="bg-white p-4 rounded-md shadow-sm border border-gray-100 flex flex-col items-center">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Highest Pieces Reached</h3>
          <div className="flex gap-4 justify-center mt-2">
            {topPieces.map(({ piece, count }, index) => (
              <div key={index} className="flex flex-col items-center">
                <div className={`h-12 w-12 rounded-md flex items-center justify-center ${getTileColor(piece)} text-lg font-bold shadow-sm`}>
                  {piece}
                </div>
                <span className="mt-1 text-base font-medium text-gray-700">×{count}</span>
              </div>
            ))}
            {topPieces.length === 0 && (
              <span className="text-gray-500 text-sm">N/A</span>
            )}
          </div>
        </div>

        <div className="bg-white p-4 rounded-md shadow-sm border border-gray-100 flex flex-col items-center">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Move Frequencies</h3>
          <div className="grid grid-cols-2 gap-2 w-full max-w-[150px]">
            <div title={`Up: ${moveFrequencies.up} moves`} className="flex items-center gap-2">
              <span className="text-lg font-bold text-blue-600">↑</span>
              <span className="text-sm font-medium">{getPercentage(moveFrequencies.up)}</span>
            </div>
            <div title={`Down: ${moveFrequencies.down} moves`} className="flex items-center gap-2">
              <span className="text-lg font-bold text-green-600">↓</span>
              <span className="text-sm font-medium">{getPercentage(moveFrequencies.down)}</span>
            </div>
            <div title={`Left: ${moveFrequencies.left} moves`} className="flex items-center gap-2">
              <span className="text-lg font-bold text-amber-600">←</span>
              <span className="text-sm font-medium">{getPercentage(moveFrequencies.left)}</span>
            </div>
            <div title={`Right: ${moveFrequencies.right} moves`} className="flex items-center gap-2">
              <span className="text-lg font-bold text-purple-600">→</span>
              <span className="text-sm font-medium">{getPercentage(moveFrequencies.right)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-md shadow-sm border border-gray-100 flex flex-col items-center">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Token Spend</h3>
          <div className="flex flex-col items-center gap-1 mt-1">
            <div className="flex items-center gap-2">
              <span className="text-base font-medium text-gray-600"><span className="font-bold">{tokenStats.inputTokens.toLocaleString()}</span> input</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base font-medium text-gray-600"><span className="font-bold">{tokenStats.outputTokens.toLocaleString()}</span> output</span>
            </div>
            {/* <span className="text-xs text-gray-400 mt-1">(pls anthropic donate credits)</span> */}
          </div>
        </div>
      </div>
    </div>
  );
};

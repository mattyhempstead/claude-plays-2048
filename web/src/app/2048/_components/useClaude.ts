'use client';

import { ERROR_SLEEP_SECONDS } from "@/lib/constants";
import { api } from "@/trpc/react";
import { create } from "zustand";
import { useGame } from "./useGame";

type MoveDirection = "up" | "down" | "left" | "right";

type MoveHistoryItem = {
  thinkingResponse?: string;
  answerResponse?: string;
  move?: MoveDirection;
  error?: string;
};

type ClaudeState = {
  isLoading: boolean;
  isThinking: boolean;
  isAnswering: boolean;
  isExtractingMove: boolean;
  isActive: boolean;
  moveHistory: MoveHistoryItem[];
  setIsLoading: (isLoading: boolean) => void;
  setIsThinking: (isThinking: boolean) => void;
  setIsAnswering: (isAnswering: boolean) => void;
  setIsExtractingMove: (isExtractingMove: boolean) => void;
  setIsActive: (isActive: boolean) => void;
  addMoveHistoryItem: () => number;
  updateMoveHistoryItem: (index: number, item: Partial<MoveHistoryItem>) => void;
};

const useClaudeStore = create<ClaudeState>((set) => ({
  isLoading: false,
  isThinking: false,
  isAnswering: false,
  isExtractingMove: false,
  isActive: false,
  moveHistory: [],
  setIsLoading: (isLoading) => set({ isLoading }),
  setIsThinking: (isThinking) => set({ isThinking }),
  setIsAnswering: (isAnswering) => set({ isAnswering }),
  setIsExtractingMove: (isExtractingMove) => set({ isExtractingMove }),
  setIsActive: (isActive) => set({ isActive }),
  addMoveHistoryItem: () => {
    let newIndex = 0;
    set((state) => {
      const newMoveHistory = [...state.moveHistory, {}];
      newIndex = newMoveHistory.length - 1;
      return { moveHistory: newMoveHistory };
    });
    return newIndex;
  },
  updateMoveHistoryItem: (index, item) => set((state) => {
    const newMoveHistory = [...state.moveHistory];
    newMoveHistory[index] = { ...newMoveHistory[index], ...item };
    return { moveHistory: newMoveHistory };
  }),
}));

export const useClaude = () => {
  const {
    isLoading,
    isThinking,
    isAnswering,
    isExtractingMove,
    isActive,
    moveHistory,
    setIsLoading,
    setIsThinking,
    setIsAnswering,
    setIsExtractingMove,
    setIsActive,
    addMoveHistoryItem,
    updateMoveHistoryItem
  } = useClaudeStore();
  
  const { board, allowedMoves } = useGame();

  const generateResponseMutation = api.ai.generateClaudeResponse.useMutation();
  const extractMoveMutation = api.ai.extractClaudeMove.useMutation();

  const generateResponse = async () => {
    try {
      setIsLoading(true);
      setIsThinking(false);
      setIsAnswering(false);
      setIsExtractingMove(false);

      // Flatten the board for the API
      console.log("Generate response for board:", JSON.stringify(board));
      const flatBoard = board.flat();
      
      // The mutation returns an AsyncGenerator
      const generator = await generateResponseMutation.mutateAsync({
        board: flatBoard,
        allowedMoves: allowedMoves,
      });

      let answerText = "";
      let thinkingText = "";
      let isInAnswerBlock = false;
      let isInThinkingBlock = false;
      
      // Create a new history item for this move
      const currentMoveIndex = addMoveHistoryItem();

      // Process each chunk from the generator
      for await (const chunk of generator) {
        // Check if this is a thinking chunk start
        if (chunk === "\n<THINKING>\n") {
          setIsThinking(true);
          isInThinkingBlock = true;
          continue;
        }
        
        // Check if thinking has ended
        if (chunk === "\n</THINKING>\n") {
          setIsThinking(false);
          isInThinkingBlock = false;
          continue;
        }

        // Check if we're entering the answer block
        if (chunk === "\n<ANSWER>\n") {
          setIsAnswering(true);
          isInAnswerBlock = true;
          continue;
        }

        // Check if we're exiting the answer block
        if (chunk === "\n</ANSWER>\n") {
          setIsAnswering(false);
          isInAnswerBlock = false;
          continue;
        }
        
        // If we're in the answer block, collect the text
        if (isInAnswerBlock) {
          answerText += chunk;
          // Update the answer response in history
          updateMoveHistoryItem(currentMoveIndex, { answerResponse: answerText });
        }
        
        // If we're in the thinking block, collect the text
        if (isInThinkingBlock) {
          thinkingText += chunk;
          // Update the thinking response in history
          updateMoveHistoryItem(currentMoveIndex, { thinkingResponse: thinkingText });
        }
      }

      // Reset states (moved from onSettled)
      setIsThinking(false);
      setIsAnswering(false);

      // Extract the move from the answer text
      if (!answerText) {
        setIsLoading(false);
        throw new Error("No answer text found in response.");
      }

      setIsExtractingMove(true);
      const move = await extractMoveMutation.mutateAsync({ answerText });
      setIsExtractingMove(false);
      
      // Update the move in history
      if (move) {
        updateMoveHistoryItem(currentMoveIndex, { move: move });
      }

      // Now that everything is complete, set isLoading to false
      setIsLoading(false);
      return { move };
    } catch (error) {
      // Reset all states if there's an error
      setIsLoading(false);
      setIsThinking(false);
      setIsAnswering(false);
      setIsExtractingMove(false);
      console.error("Error in generateResponse:", error);
      
      // Add error to move history
      const errorMessage = `There was an error fetching Claude's response. Trying again in ${ERROR_SLEEP_SECONDS} seconds.`;
      const currentMoveIndex = addMoveHistoryItem();
      updateMoveHistoryItem(currentMoveIndex, { error: errorMessage });
      
      return { error: true } as const;
    }
  };

  // Get only the last 3 items from the move history
  const limitedMoveHistory = moveHistory.slice(-3);

  return {
    isLoading,
    isThinking,
    isAnswering,
    isExtractingMove,
    isActive,
    setIsActive,
    generateResponse,
    moveHistory: limitedMoveHistory,
  };
};
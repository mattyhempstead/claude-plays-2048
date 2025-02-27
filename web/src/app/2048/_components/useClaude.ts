'use client';

import { api } from "@/trpc/react";
import { useState } from "react";

type MoveDirection = "up" | "down" | "left" | "right";

type MoveHistoryItem = {
  thinkingResponse?: string;
  answerResponse?: string;
  move?: MoveDirection;
};

export const useClaude = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [isAnswering, setIsAnswering] = useState<boolean>(false);
  const [isExtractingMove, setIsExtractingMove] = useState<boolean>(false);
  const [moveHistory, setMoveHistory] = useState<MoveHistoryItem[]>([]);
  
  const generateResponseMutation = api.ai.generateClaudeResponse.useMutation({
    onMutate: () => {
      setIsLoading(true);
      setIsThinking(false);
      setIsAnswering(false);
      setIsExtractingMove(false);
    },
    onSettled: () => {
      // We don't set isLoading to false here anymore
      // It will be set to false after the move is calculated
      setIsThinking(false);
      setIsAnswering(false);
    },
  });

  const extractMoveMutation = api.ai.extractClaudeMove.useMutation({
    onMutate: () => {
      setIsExtractingMove(true);
    },
    onSettled: () => {
      setIsExtractingMove(false);
    },
  });

  const generateResponse = async (board: number[]) => {
    try {
      // The mutation returns an AsyncGenerator
      const generator = await generateResponseMutation.mutateAsync({
        board,
      });

      let answerText = "";
      let thinkingText = "";
      let isInAnswerBlock = false;
      let isInThinkingBlock = false;
      
      // Create a new history item for this move
      const currentMoveIndex = moveHistory.length;
      setMoveHistory(prev => [...prev, {}]);

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
          setMoveHistory(prev => {
            const updated = [...prev];
            updated[currentMoveIndex] = {
              ...updated[currentMoveIndex],
              answerResponse: answerText
            };
            return updated;
          });
        }
        
        // If we're in the thinking block, collect the text
        if (isInThinkingBlock) {
          thinkingText += chunk;
          // Update the thinking response in history
          setMoveHistory(prev => {
            const updated = [...prev];
            updated[currentMoveIndex] = {
              ...updated[currentMoveIndex],
              thinkingResponse: thinkingText
            };
            return updated;
          });
        }
      }

      // Extract the move from the answer text
      if (answerText) {
        try {
          const move = await extractMoveMutation.mutateAsync({ answerText });
          
          // Update the move in history
          if (move) {
            setMoveHistory(prev => {
              const updated = [...prev];
              updated[currentMoveIndex] = {
                ...updated[currentMoveIndex],
                move: move as MoveDirection
              };
              return updated;
            });
          }
          
          // Now that everything is complete, set isLoading to false
          setIsLoading(false);
          return { move };
        } catch (error) {
          setIsLoading(false);
          console.error("Error extracting move:", error);
          return { move: null };
        }
      }

      setIsLoading(false);
      return { move: null };
    } catch (error) {
      setIsLoading(false);
      console.error("Error streaming response:", error);
      return { move: null };
    }
  };

  return {
    isLoading,
    isThinking,
    isAnswering,
    isExtractingMove,
    generateResponse,
    moveHistory,
  };
};
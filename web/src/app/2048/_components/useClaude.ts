'use client';

import { api } from "@/trpc/react";
import { useState } from "react";

export const useClaude = () => {
  const [streamedResponse, setStreamedResponse] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isThinking, setIsThinking] = useState<boolean>(false);
  
  const generateResponseMutation = api.ai.generateClaudeResponse.useMutation({
    onMutate: () => {
      setIsLoading(true);
      setStreamedResponse("");
      setIsThinking(false);
    },
    onSettled: () => {
      setIsLoading(false);
      setIsThinking(false);
    },
  });

  const extractMoveMutation = api.ai.extractClaudeMove.useMutation();

  const generateResponse = async (board: number[]) => {
    try {
      // The mutation returns an AsyncGenerator
      const generator = await generateResponseMutation.mutateAsync({
        board,
      });

      let answerText = "";
      let isInAnswerBlock = false;

      // Process each chunk from the generator
      for await (const chunk of generator) {
        // Check if this is a thinking chunk
        if (chunk === "\n<THINKING>\n") {
          setIsThinking(true);
          // Add thinking tag to the response
          setStreamedResponse((prev) => prev + chunk);
          continue;
        }
        
        // Check if thinking has ended
        if (chunk === "\n</THINKING>\n") {
          setIsThinking(false);
          setStreamedResponse((prev) => prev + chunk);
          continue;
        }

        // Check if we're entering the answer block
        if (chunk === "\n<ANSWER>\n") {
          isInAnswerBlock = true;
          setStreamedResponse((prev) => prev + chunk);
          continue;
        }

        // Check if we're exiting the answer block
        if (chunk === "\n</ANSWER>\n") {
          isInAnswerBlock = false;
          setStreamedResponse((prev) => prev + chunk);
          continue;
        }
        
        // If we're in the answer block, collect the text
        if (isInAnswerBlock) {
          answerText += chunk;
        }

        setStreamedResponse((prev) => prev + chunk);
      }

      // Extract the move from the answer text
      if (answerText) {
        const move = await extractMoveMutation.mutateAsync({ answerText });
        return { move };
      }

      return { move: null };
    } catch (error) {
      console.error("Error streaming response:", error);
      setStreamedResponse((prev) => prev + "\nError: Failed to generate response.");
      return { move: null };
    }
  };

  return {
    streamedResponse,
    isLoading,
    isThinking,
    generateResponse,
  };
};
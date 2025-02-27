'use client';

import { Button } from "@/components/ui/button";
import { api } from "@/trpc/react";
import { Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const INITIAL_BOARD = [
  0, 0, 0, 0,
  2, 4, 8, 16,
  32, 64, 128, 256,
  512, 1024, 2048, 4096,
];

export default function Page() {
  const responseRef = useRef<HTMLDivElement>(null);
  const { streamedResponse, isLoading, isThinking, generateResponse } = useClaude();

  // Auto-scroll to bottom of response container
  useEffect(() => {
    if (responseRef.current) {
      responseRef.current.scrollTop = responseRef.current.scrollHeight;
    }
  }, [streamedResponse]);

  const handleGenerateResponse = async () => {
    const result = await generateResponse(INITIAL_BOARD);
    console.log("Move result:", result);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="mb-6 text-3xl font-bold">Claude AI Assistant</h1>
      
      <div className="mb-4">
        <h2 className="mb-2 text-xl font-semibold">Board State:</h2>
        <div className="mb-4 max-w-xs">
          {[0, 4, 8, 12].map((rowStart, rowIndex) => (
            <div className={`flex gap-1 ${rowIndex > 0 ? 'mt-1' : ''}`} key={rowStart}>
              {INITIAL_BOARD.slice(rowStart, rowStart + 4).map((value, index) => (
                <div 
                  key={rowStart + index} 
                  className="aspect-square h-12 w-12 flex items-center justify-center border border-gray-300 rounded-md bg-gray-50"
                >
                  {value || ""}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <Button 
        onClick={handleGenerateResponse}
        disabled={isLoading}
        className={`mb-4 ${isThinking ? 'bg-amber-600 hover:bg-amber-700' : ''}`}
      >
        {isLoading || isThinking ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {isThinking ? "Claude is thinking..." : "Generating..."}
          </>
        ) : (
          "Generate Move"
        )}
      </Button>

      {(isLoading || streamedResponse) && (
        <div className="mt-6">
          <h2 className="mb-2 text-xl font-semibold">Response:</h2>
          <div 
            ref={responseRef}
            className="max-h-[500px] overflow-y-auto rounded-md border border-gray-300 bg-gray-50 p-4 font-mono whitespace-pre-wrap"
          >
            {streamedResponse || (
              <div className="flex items-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isThinking ? "Claude is thinking..." : "Generating response..."}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const useClaude = () => {
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
        if (chunk === "<CONTENT_START>" || chunk === "<CONTENT_END>") {
          // These are markers, don't display them to the user
          continue;
        }
        
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
'use client';

import { Button } from "@/components/ui/button";
import { api } from "@/trpc/react";
import { Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const INITIAL_BOARD = [
  4, 4, 0, 2,
  2, 0, 0, 0,
  0, 0, 0, 0,
  0, 2, 0, 0,
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
    await generateResponse(INITIAL_BOARD);
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

  const generateResponse = async (board: number[]) => {
    try {
      // The mutation returns an AsyncGenerator
      const generator = await generateResponseMutation.mutateAsync({
        board,
      });

      // Process each chunk from the generator
      for await (const chunk of generator) {
        if (chunk === "<CONTENT_START>" || chunk === "<CONTENT_END>") {
          // These are markers, don't display them to the user
          continue;
        }
        
        // Check if this is a thinking chunk
        if (chunk === "\n<THINKING>\n") {
          setIsThinking(true);
          // Don't add thinking to the final response
          continue;
        }
        
        // Check if thinking has ended
        if (chunk === "\n</THINKING>\n") {
          setIsThinking(false);
          continue;
        }
        
        // If it was thinking and now we're getting a response, add a line break
        if (isThinking && chunk.startsWith("Response: ")) {
          setIsThinking(false);
          setStreamedResponse((prev) => prev + "\n");
          // Remove the "Response: " prefix
          const responseText = chunk.replace("Response: ", "");
          setStreamedResponse((prev) => prev + responseText);
          continue;
        }
        
        setStreamedResponse((prev) => prev + chunk);
      }
    } catch (error) {
      console.error("Error streaming response:", error);
      setStreamedResponse((prev) => prev + "\nError: Failed to generate response.");
    }
  };

  return {
    streamedResponse,
    isLoading,
    isThinking,
    generateResponse,
  };
};
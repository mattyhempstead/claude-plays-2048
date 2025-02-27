'use client';

import { Button } from "@/components/ui/button";
import { api } from "@/trpc/react";
import { Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export default function Page() {
  const [prompt, setPrompt] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [streamedResponse, setStreamedResponse] = useState<string>("");
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const responseRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of response container
  useEffect(() => {
    if (responseRef.current) {
      responseRef.current.scrollTop = responseRef.current.scrollHeight;
    }
  }, [streamedResponse]);

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

  const handleGenerateResponse = async () => {
    if (!prompt.trim()) return;
    
    try {
      // The mutation returns an AsyncGenerator
      const generator = await generateResponseMutation.mutateAsync({
        board: [
          4, 4, 0, 2,
          2, 0, 0, 0,
          0, 0, 0, 0,
          0, 2, 0, 0,
        ],
      });

      // Process each chunk from the generator
      for await (const chunk of generator) {
        if (chunk === "<CONTENT_START>" || chunk === "<CONTENT_END>") {
          // These are markers, don't display them to the user
          continue;
        }
        
        // Check if this is a thinking chunk
        if (chunk.startsWith("Thinking: ")) {
          setIsThinking(true);
          // Don't add thinking to the final response
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

  return (
    <div className="container mx-auto p-4">
      <h1 className="mb-6 text-3xl font-bold">Claude AI Assistant</h1>
      
      <div className="mb-4">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter your prompt here..."
          className="w-full rounded-md border border-gray-300 p-2"
          rows={5}
        />
      </div>
      
      <Button 
        onClick={handleGenerateResponse}
        disabled={isLoading || !prompt.trim()}
        className="mb-4"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {isThinking ? "Thinking..." : "Generating..."}
          </>
        ) : (
          "Generate Response"
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

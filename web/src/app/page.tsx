'use client';

import { Button } from "@/components/ui/button";
import { api } from "@/trpc/react";
import { useState } from "react";

export default function Page() {
  const [prompt, setPrompt] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const generateResponseMutation = api.ai.generateClaudeResponse.useMutation({
    onMutate: () => {
      setIsLoading(true);
    },
    onSettled: () => {
      setIsLoading(false);
    },
  });

  const handleGenerateResponse = () => {
    if (!prompt.trim()) return;
    
    generateResponseMutation.mutate({
      prompt: prompt,
    });
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
      >
        {isLoading ? "Generating..." : "Generate Response"}
      </Button>
    </div>
  );
}

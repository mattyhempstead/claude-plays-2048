import { env } from "@/env";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

const anthropic = new Anthropic({
  apiKey: env.ANTHROPIC_API_KEY,
});

export const aiRouter = createTRPCRouter({
  generateClaudeResponse: publicProcedure
    .input(z.object({
      prompt: z.string(),
    }))
    .mutation(async function* ({ input }) {
      try {
        const stream = anthropic.messages.stream({
          model: "claude-3-7-sonnet-20250219",
          max_tokens: 20000,
          thinking: {
            type: "enabled",
            budget_tokens: 16000
          },
          messages: [{
            role: "user",
            content: input.prompt
          }]
        });

        yield "<CONTENT_START>";

        for await (const event of stream) {
          if (event.type === 'content_block_start') {
            console.log(`\nStarting ${event.content_block.type} block...`);
            yield `\nStarting ${event.content_block.type} block...`;
          } else if (event.type === 'content_block_delta') {
            if (event.delta.type === 'thinking_delta') {
              console.log(`Thinking: ${event.delta.thinking}`);
              yield `Thinking: ${event.delta.thinking}`;
            } else if (event.delta.type === 'text_delta') {
              console.log(`Response: ${event.delta.text}`);
              yield event.delta.text;
            }
          } else if (event.type === 'content_block_stop') {
            console.log('\nBlock complete.');
            yield '\nBlock complete.';
          }
        }

        yield "<CONTENT_END>";
      } catch (error) {
        console.error("Error generating Claude response:", error);
        yield `Error: ${error instanceof Error ? error.message : String(error)}`;
      }
    }),
});

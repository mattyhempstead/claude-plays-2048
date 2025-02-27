import { env } from "@/env";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

const STREAM_CHUNK_DELAY_MS = 500;

const anthropic = new Anthropic({
  apiKey: env.ANTHROPIC_API_KEY,
});

// Define move enum
const MoveEnum = z.enum(["up", "right", "down", "left"]);
type Move = z.infer<typeof MoveEnum>;

export const aiRouter = createTRPCRouter({
  generateClaudeResponse: publicProcedure
    .input(z.object({
      board: z.array(z.number()).length(16),
    }))
    .mutation(async function* ({ input }) {
      try {
        const stream = anthropic.messages.stream({
          model: "claude-3-7-sonnet-latest",
          max_tokens: 2048,
          thinking: {
            type: "enabled",
            budget_tokens: 1024
          },
          messages: [{
            role: "user",
            content: `\
You will be given a game of 2048.

Your task is to analyze the current board state and determine the optimal move.

Think about the board to determine the best move in order to maximize the score in the long term.
Decide on either "up", "down", "left", or "right".

Do not spend too long thinking about the board, try to quickly determine the best move.
When you give your answer, respond with a very brief justification and the move to make.

Recall that
 - All numbers on the board are powers of 2.
 - Moving will slide all tiles in the chosen direction and tiles will merge if they have the same number and are pushed into eachother.
 - After a move, a new tile will appear in a random empty square with a value of either 2 (90% chance) or 4 (10% chance).
 - Moving in a direction where no tiles can slide is an invalid move and should be avoided.

The board is a 4x4 grid that is shown below.
Each square in the grid is a number and commas are used to separate the numbers in each row.
The number "0" is used to represent an empty space.

<BOARD>
${input.board.slice(0, 4).join(',')}
${input.board.slice(4, 8).join(',')}
${input.board.slice(8, 12).join(',')}
${input.board.slice(12, 16).join(',')}
</BOARD>
`
          }]
        });

        yield "<CONTENT_START>";

        let isInThinkingBlock = false;
        let isInAnswerBlock = false;

        for await (const event of stream) {
          // Add a small delay to avoid overwhelming the client
          if (STREAM_CHUNK_DELAY_MS > 0) {
            await new Promise(resolve => setTimeout(resolve, STREAM_CHUNK_DELAY_MS));
          }

          if (event.type === 'content_block_start') {
            console.log(`\nStarting ${event.content_block.type} block...`);

            if (event.content_block.type === 'thinking') {
              isInThinkingBlock = true;
              yield "\n<THINKING>\n";
            } else if (event.content_block.type === 'text') {
              isInAnswerBlock = true;
              yield "\n<ANSWER>\n";
            }
          } else if (event.type === 'content_block_delta') {
            if (event.delta.type === 'thinking_delta') {
              console.log(`Thinking: ${event.delta.thinking}`);
              yield event.delta.thinking;
            } else if (event.delta.type === 'text_delta') {
              console.log(`Response: ${event.delta.text}`);
              yield event.delta.text;
            }
          } else if (event.type === 'content_block_stop') {
            console.log('\nBlock complete.');

            if (isInThinkingBlock) {
              isInThinkingBlock = false;
              yield "\n</THINKING>\n";
            } else if (isInAnswerBlock) {
              isInAnswerBlock = false;
              yield "\n</ANSWER>\n";
            }
          }
        }

        yield "<CONTENT_END>";

        // Get the complete message to access full usage information
        const message = await stream.finalMessage();
        console.log("USAGE", {
          input_tokens: message.usage.input_tokens,
          output_tokens: message.usage.output_tokens,
          cache_creation_input_tokens: message.usage.cache_creation_input_tokens,
          cache_read_input_tokens: message.usage.cache_read_input_tokens
        });

      } catch (error) {
        console.error("Error generating Claude response:", error);
        yield `Error: ${error instanceof Error ? error.message : String(error)}`;
      }
    }),

  extractClaudeMove: publicProcedure
    .input(z.object({
      answerText: z.string(),
    }))
    .mutation(async ({ input }): Promise<Move> => {
      try {
        // Define the move tool inline

        // Create a message with system prompt to make the tool call
        const response = await anthropic.messages.create({
          model: "claude-3-5-haiku-latest",
          max_tokens: 1024,
          system: `\
You extract the move direction from the provided response.

The response will ask for one of the following:
- "up"
- "right"
- "down"
- "left"
          `,
          tools: [{
            name: "submit_move",
            description: "Submit the suggested move direction.",
            input_schema: {
              type: "object",
              properties: {
                move: {
                  type: "string",
                  enum: ["up", "right", "down", "left"],
                  description: "The direction to move"
                }
              },
              required: ["move"]
            }
          }],
          tool_choice: {
            type: "tool",
            name: "submit_move"
          },
          messages: [{
            role: "user",
            content: `\
Extract the move direction from the following response:

<RESPONSE>
${input.answerText}
</RESPONSE>
`
          }]
        });

        console.log("MOVE USAGE", {
          input_tokens: response.usage.input_tokens,
          output_tokens: response.usage.output_tokens,
          cache_creation_input_tokens: response.usage.cache_creation_input_tokens,
          cache_read_input_tokens: response.usage.cache_read_input_tokens
        });

        // Find the tool use request
        const toolUseBlock = response.content.find(block => block.type === "tool_use");
        
        if (!toolUseBlock || toolUseBlock.type !== "tool_use") {
          throw new Error("No tool use request received");
        }

        // Define Zod schema for the tool input inline and extract the move direction
        const moveSchema = z.object({
          move: MoveEnum
        });
        
        const parsedInput = moveSchema.parse(toolUseBlock.input);
        return parsedInput.move;
      } catch (error) {
        console.error("Error generating Claude move:", error);
        throw error;
      }
    }),
});

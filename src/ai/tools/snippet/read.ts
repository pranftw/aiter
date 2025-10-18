import { tool } from "ai";
import { z } from "zod";
import { SnippetSchema, ToolContextSchema } from "@/lib/schema";
import { getSnippet } from "@/utils/chat";
import { addLineNumbersToCode, cropCode } from "@/utils/code";



const readSnippetToolInputSchema = z.object({
  id: z.string().describe('ID of the code snippet to retrieve'),
  startLine: z.number().optional().default(0).describe('Start line of the code snippet to read'),
  numLines: z.number().optional().default(25).describe('Number of lines of the code snippet to read'),
  readFull: z.boolean().optional().default(false).describe('Set to true to read the full snippet. Use this only if you find that it is necessary to get the context of the full snippet.'),
});


const readSnippetToolOutputSchema = z.object({
  snippet: SnippetSchema.nullable(),
  response: z.string()
});


export const read_snippet = tool({
  name: 'read_snippet',
  description: `Read code snippet (includes line numbers)`,
  inputSchema: readSnippetToolInputSchema,
  outputSchema: readSnippetToolOutputSchema,
  execute: async ({id, startLine, numLines, readFull}, {experimental_context: context}) => {
    const {chatId} = context as z.infer<typeof ToolContextSchema>;
    const {result: {snippet}, status: getSnippetStatus, message: getSnippetMessage} = await getSnippet(chatId, id);
    if (getSnippetStatus === 'error') {
      return {
        snippet: null,
        response: getSnippetMessage,
      }
    }
    if (!readFull) {
      snippet.content = cropCode(snippet.content, startLine, numLines);
    }
    snippet.content = addLineNumbersToCode(snippet.content, startLine);
    return {
      snippet: snippet,
      response: snippet.content.startsWith('ERROR:') ? snippet.content : getSnippetMessage,
    }
  }
});
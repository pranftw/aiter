import { tool } from "ai";
import { z } from "zod";
import { ToolContextSchema } from "@/lib/schema";
import { getSnippet } from "@/utils/chat";
import { lintPython } from "@/utils/code";
import {executePythonSnippet} from "@/utils/code";



const executeSnippetToolInputSchema = z.object({
  id: z.string().describe('ID of the code snippet to execute'),
  args: z.string().optional().default('').describe('Command line arguments to pass while executing. For example, specify **--arg1 foo --arg2 bar** to pass arguments.'),
});


const executeSnippetToolOutputSchema = z.object({
  response: z.string(),
});


export const execute_snippet = tool({
  name: 'execute_snippet',
  description: `Execute code snippet`,
  inputSchema: executeSnippetToolInputSchema,
  outputSchema: executeSnippetToolOutputSchema,
  execute: async ({id, args}, {experimental_context: context}) => {
    const {chatId} = context as z.infer<typeof ToolContextSchema>;
    const {result: {snippet}, status: getSnippetStatus, message: getSnippetMessage} = await getSnippet(chatId, id);
    if (getSnippetStatus === 'error') {
      return {
        response: getSnippetMessage,
      };
    }
    const lintResult = lintPython('snippet.py', snippet.content);
    if (lintResult) {
      return {
        response: lintResult,
      };
    }
    const result = executePythonSnippet(snippet, args);
    return {
      response: result,
    };
  },
});
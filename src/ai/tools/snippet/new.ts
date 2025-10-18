import { SnippetSchema, ToolContextSchema } from "@/lib/schema";
import {generateId, tool} from "ai";
import { z } from "zod";
import { getChat, updateChat } from "@/utils/chat";
import { lintPython } from "@/utils/code";



const newSnippetToolInputSchema = z.object({
  description: z.string().describe('Description regarding what the code snippet does'),
  content: z.string().describe('Code content of the snippet'),
});


const newSnippetToolOutputSchema = z.object({
  snippet: SnippetSchema.nullable(),
  response: z.string().optional(),
});


export const new_snippet = tool({
  name: 'new_snippet',
  description: `Create code snippet`,
  inputSchema: newSnippetToolInputSchema,
  outputSchema: newSnippetToolOutputSchema,
  execute: async ({description, content}, {experimental_context: context}) => {
    const {chatId} = context as z.infer<typeof ToolContextSchema>;
    const lintResult = lintPython('snippet.py', content);
    if (lintResult) {
      return {
        snippet: null,
        response: lintResult,
      };
    }
    const snippetId = generateId();
    const chat = await getChat(chatId);
    const snippet = {
      id: snippetId,
      chatId: chatId,
      description: description,
      content: content,
    };
    chat.snippets[snippetId] = snippet;
    await updateChat(chatId, chat);
    return {
      snippet: snippet,
    };
  },
  toModelOutput: (result) => {
    if (result.snippet) {
      return {
        type: 'text',
        value: `Snippet created with id: ${result.snippet.id}`
      }
    }
    else {
      return {
        type: 'text',
        value: result.response || 'Encountered an error!',
      }
    }
  }
});
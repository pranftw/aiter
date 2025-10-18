import { tool } from "ai";
import { z } from "zod";
import { ToolContextSchema } from "@/lib/schema";
import { getSnippet, updateChat } from "@/utils/chat";



const deleteSnippetToolInputSchema = z.object({
  id: z.string().describe('ID of the code snippet to delete'),
});


const deleteSnippetToolOutputSchema = z.object({
  response: z.string(),
});


export const delete_snippet = tool({
  name: 'delete_snippet',
  description: `Delete code snippet`,
  inputSchema: deleteSnippetToolInputSchema,
  outputSchema: deleteSnippetToolOutputSchema,
  execute: async ({id}, {experimental_context: context}) => {
    const {chatId} = context as z.infer<typeof ToolContextSchema>;
    const {result: {chat}, status: getSnippetStatus, message: getSnippetMessage} = await getSnippet(chatId, id);
    if (getSnippetStatus === 'error') {
      return {
        response: getSnippetMessage,
      };
    }
    delete chat.snippets[id];
    await updateChat(chatId, chat);
    return {
      response: `Snippet deleted!`,
    };
  }
});
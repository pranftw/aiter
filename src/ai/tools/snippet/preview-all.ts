import { tool } from 'ai';
import { z } from 'zod';
import { ToolContextSchema } from '@/lib/schema';
import { getChat } from '@/utils/chat';


const SnippetPreviewSchema = z.object({
  id: z.string(),
  description: z.string(),
});


const previewAllSnippetsToolInputSchema = z.object({});


const previewAllSnippetsToolOutputSchema = z.object({
  snippets: z.array(SnippetPreviewSchema),
});


export const preview_all_snippets = tool({
  name: 'preview_all_snippets',
  description: `Get preview of all snippets for the current chat. Use this when you need clarity on:
- What snippets have been created during exploration
- Which snippets are available to integrate into the scraper
- Overview of all snippet functionality before reading full content
- Avoiding duplicate snippet creation`,
  inputSchema: previewAllSnippetsToolInputSchema,
  outputSchema: previewAllSnippetsToolOutputSchema,
  execute: async ({}, {experimental_context: context}) => {
    const {chatId} = context as z.infer<typeof ToolContextSchema>;
    const chat = await getChat(chatId);
    const snippets = Object.values(chat.snippets).map(snippet => ({
      id: snippet.id,
      description: snippet.description,
    }));
    return {
      snippets: snippets,
    };
  }
});
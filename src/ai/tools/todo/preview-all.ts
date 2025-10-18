import { tool } from 'ai';
import { z } from 'zod';
import { ToolContextSchema } from '@/lib/schema';
import { getChat } from '@/utils/chat';


const TodoPreviewSchema = z.object({
  id: z.string(),
  description: z.string(),
});


const previewAllTodosToolInputSchema = z.object({});


const previewAllTodosToolOutputSchema = z.object({
  todos: z.array(TodoPreviewSchema),
});


export const preview_all_todos = tool({
  name: 'preview_all_todos',
  description: `Get preview of all todo lists for the current chat. Use this when you need clarity on:
- What todo lists already exist for the current project
- Which todo list to add new items to
- Overview of project organization before creating new lists
- Avoiding duplicate todo list creation`,
  inputSchema: previewAllTodosToolInputSchema,
  outputSchema: previewAllTodosToolOutputSchema,
  execute: async ({}, {experimental_context: context}) => {
    const {chatId} = context as z.infer<typeof ToolContextSchema>;
    const chat = await getChat(chatId);
    const todos = Object.values(chat.todos).map(todo => ({
      id: todo.id,
      description: todo.description,
    }));
    return {
      todos: todos,
    };
  }
});
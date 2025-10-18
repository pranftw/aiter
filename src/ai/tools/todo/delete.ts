import { tool } from 'ai';
import { z } from 'zod';
import { ToolContextSchema } from '@/lib/schema';
import { getTodo, updateChat } from '@/utils/chat';


const deleteTodoToolInputSchema = z.object({
  id: z.string().describe('ID of the todo list to delete'),
});


const deleteTodoToolOutputSchema = z.object({
  response: z.string(),
});


export const delete_todo = tool({
  name: 'delete_todo',
  description: `Delete todo list`,
  inputSchema: deleteTodoToolInputSchema,
  outputSchema: deleteTodoToolOutputSchema,
  execute: async ({id}, {experimental_context: context}) => {
    const {chatId} = context as z.infer<typeof ToolContextSchema>;
    const {result: {chat}, status: getTodoStatus, message: getTodoMessage} = await getTodo(chatId, id);
    if (getTodoStatus === 'error') {
      return {
        response: getTodoMessage,
      };
    }
    delete chat.todos[id];
    await updateChat(chatId, chat);
    return {
      response: `Todo list deleted!`,
    };
  }
});

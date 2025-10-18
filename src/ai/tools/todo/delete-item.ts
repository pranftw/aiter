import { tool } from 'ai';
import { z } from 'zod';
import { ToolContextSchema } from '@/lib/schema';
import { getTodoItem, updateChat } from '@/utils/chat';


const deleteTodoItemToolInputSchema = z.object({
  id: z.string().describe('ID of the todo list'),
  itemId: z.string().describe('ID of the todo item to delete'),
});


const deleteTodoItemToolOutputSchema = z.object({
  response: z.string(),
});


export const delete_todo_item = tool({
  name: 'delete_todo_item',
  description: `Delete a todo item from a todo list`,
  inputSchema: deleteTodoItemToolInputSchema,
  outputSchema: deleteTodoItemToolOutputSchema,
  execute: async ({id, itemId}, {experimental_context: context}) => {
    const {chatId} = context as z.infer<typeof ToolContextSchema>;
    const {result: {chat}, status: getTodoItemStatus, message: getTodoItemMessage} = await getTodoItem(chatId, id, itemId);
    if (getTodoItemStatus === 'error') {
      return {
        response: getTodoItemMessage,
      };
    }
    // Important: Remove from items AND from itemOrder array
    delete chat.todos[id].items[itemId];
    chat.todos[id].itemOrder = chat.todos[id].itemOrder.filter((itemOrderId: string) => itemOrderId !== itemId);
    await updateChat(chatId, chat);
    return {
      response: `Todo item deleted!`,
    };
  }
});

import { tool } from 'ai';
import { z } from 'zod';
import { ToolContextSchema } from '@/lib/schema';
import { getTodo, updateChat } from '@/utils/chat';
import { generateId } from 'ai';


const newTodoItemToolInputSchema = z.object({
  id: z.string().describe('ID of the todo list to add item to'),
  content: z.string().describe('Content/description of the todo item'),
});


const newTodoItemToolOutputSchema = z.object({
  response: z.string().optional(),
});


export const new_todo_item = tool({
  name: 'new_todo_item',
  description: `Add a new item to a todo list`,
  inputSchema: newTodoItemToolInputSchema,
  outputSchema: newTodoItemToolOutputSchema,
  execute: async ({id, content}, {experimental_context: context}) => {
    const {chatId} = context as z.infer<typeof ToolContextSchema>;
    const {result: {chat}, status: getTodoStatus, message: getTodoMessage} = await getTodo(chatId, id);
    if (getTodoStatus === 'error') {
      return {
        response: getTodoMessage,
      };
    }
    const itemId = generateId();
    const todoItem = {
      id: itemId,
      status: 'pending' as const,
      content: content,
    };
    chat.todos[id].items[itemId] = todoItem;
    // Important: Add to itemOrder array to maintain order
    chat.todos[id].itemOrder.push(itemId);
    await updateChat(chatId, chat);
    return {
      response: `Todo item created with id: ${itemId}`,
    };
  }
});

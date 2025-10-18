import { tool } from 'ai';
import { z } from 'zod';
import { TodoItemSchema, ToolContextSchema } from '@/lib/schema';
import { getTodoItem } from '@/utils/chat';


const readTodoItemToolInputSchema = z.object({
  id: z.string().describe('ID of the todo list'),
  itemId: z.string().describe('ID of the todo item to retrieve'),
});


const readTodoItemToolOutputSchema = z.object({
  todoItem: TodoItemSchema.nullable(),
  response: z.string()
});


export const read_todo_item = tool({
  name: 'read_todo_item',
  description: `Read a specific todo item`,
  inputSchema: readTodoItemToolInputSchema,
  outputSchema: readTodoItemToolOutputSchema,
  execute: async ({id, itemId}, {experimental_context: context}) => {
    const {chatId} = context as z.infer<typeof ToolContextSchema>;
    const {result: {todoItem}, status: getTodoItemStatus, message: getTodoItemMessage} = await getTodoItem(chatId, id, itemId);
    if (getTodoItemStatus === 'error') {
      return {
        todoItem: null,
        response: getTodoItemMessage,
      }
    }
    return {
      todoItem: todoItem,
      response: getTodoItemMessage,
    }
  }
});

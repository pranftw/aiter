import { tool } from 'ai';
import { z } from 'zod';
import { ToolContextSchema } from '@/lib/schema';
import { getTodoItem, updateChat } from '@/utils/chat';


const editTodoItemToolInputSchema = z.object({
  id: z.string().describe('ID of the todo list'),
  itemId: z.string().describe('ID of the todo item to edit'),
  content: z.string().describe('New content for the todo item'),
});


const editTodoItemToolOutputSchema = z.object({
  response: z.string(),
});


export const edit_todo_item = tool({
  name: 'edit_todo_item',
  description: `Edit the content of a todo item`,
  inputSchema: editTodoItemToolInputSchema,
  outputSchema: editTodoItemToolOutputSchema,
  execute: async ({id, itemId, content}, {experimental_context: context}) => {
    const {chatId} = context as z.infer<typeof ToolContextSchema>;
    const {result: {chat}, status: getTodoItemStatus, message: getTodoItemMessage} = await getTodoItem(chatId, id, itemId);
    if (getTodoItemStatus === 'error') {
      return {
        response: getTodoItemMessage,
      };
    }
    chat.todos[id].items[itemId].content = content;
    await updateChat(chatId, chat);
    return {
      response: `Todo item edited!`,
    };
  }
});

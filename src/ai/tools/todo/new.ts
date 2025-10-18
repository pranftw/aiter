import { ToolContextSchema } from '@/lib/schema';
import { generateId, tool } from 'ai';
import { z } from 'zod';
import { getChat, updateChat } from '@/utils/chat';


const newTodoToolInputSchema = z.object({
  description: z.string().describe('Description of what the todo list is for'),
});


const newTodoToolOutputSchema = z.object({
  response: z.string(),
});


export const new_todo = tool({
  name: 'new_todo',
  description: `Create a new todo list`,
  inputSchema: newTodoToolInputSchema,
  outputSchema: newTodoToolOutputSchema,
  execute: async ({description}, {experimental_context: context}) => {
    const {chatId} = context as z.infer<typeof ToolContextSchema>;
    const todoId = generateId();
    const chat = await getChat(chatId);
    const todo = {
      id: todoId,
      chatId: chatId,
      description: description,
      items: {},
      itemOrder: [],
    };
    chat.todos[todoId] = todo;
    await updateChat(chatId, chat);
    return {
      response: `Todo list created with id: ${todoId}`,
    };
  }
});

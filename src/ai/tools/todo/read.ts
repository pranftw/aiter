import { tool } from 'ai';
import { z } from 'zod';
import { TodoSchema, ToolContextSchema } from '@/lib/schema';
import { getTodo } from '@/utils/chat';


const readTodoToolInputSchema = z.object({
  id: z.string().describe('ID of the todo list to retrieve'),
});


const readTodoToolOutputSchema = z.object({
  todo: TodoSchema.nullable(),
  response: z.string()
});


export const read_todo = tool({
  name: 'read_todo',
  description: `Read todo list with all items`,
  inputSchema: readTodoToolInputSchema,
  outputSchema: readTodoToolOutputSchema,
  execute: async ({id}, {experimental_context: context}) => {
    const {chatId} = context as z.infer<typeof ToolContextSchema>;
    const {result: {todo}, status: getTodoStatus, message: getTodoMessage} = await getTodo(chatId, id);
    if (getTodoStatus === 'error') {
      return {
        todo: null,
        response: getTodoMessage,
      }
    }
    return {
      todo: todo,
      response: getTodoMessage,
    }
  }
});


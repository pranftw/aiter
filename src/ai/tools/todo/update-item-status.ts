import { tool } from 'ai';
import { z } from 'zod';
import { ToolContextSchema, TodoItemSchema } from '@/lib/schema';
import { getTodoItem, updateChat } from '@/utils/chat';
import { getErrorStatusResponseMessage } from '@/utils/utils';


const updateTodoItemStatusToolInputSchema = z.object({
  id: z.string().describe('ID of the todo list'),
  itemId: z.string().describe('ID of the todo item to update'),
  status: z.enum(['pending', 'in_progress', 'completed']).describe('New status for the todo item'),
});


const updateTodoItemStatusToolOutputSchema = z.object({
  response: z.string(),
});


export const update_todo_item_status = tool({
  name: 'update_todo_item_status',
  description: `Update the status of a todo item. Enforces sequential execution workflow.

IMPORTANT RULES:
- Only ONE item can be 'in_progress' at a time across the entire todo list
- Items can ONLY be marked 'in_progress' if all previous items in the list are 'completed'
- This ensures structured, step-by-step progress through tasks
- Always mark item as 'in_progress' BEFORE starting work on it
- Mark as 'completed' when work is finished, then move to the next item

The tool will reject status updates that violate these sequential execution rules.`,
  inputSchema: updateTodoItemStatusToolInputSchema,
  outputSchema: updateTodoItemStatusToolOutputSchema,
  execute: async ({id, itemId, status}, {experimental_context: context}) => {
    const {chatId} = context as z.infer<typeof ToolContextSchema>;
    const {result: {chat}, status: getTodoItemStatus, message: getTodoItemMessage} = await getTodoItem(chatId, id, itemId);
    if (getTodoItemStatus === 'error') {
      return {
        response: getTodoItemMessage,
      };
    }
    // Validate status enum
    const validStatuses = ['pending', 'in_progress', 'completed'];
    if (!validStatuses.includes(status)) {
      return {
        response: getErrorStatusResponseMessage(`Invalid status. Must be one of: ${validStatuses.join(', ')}`),
      };
    }

    const todo = chat.todos[id];
    
    // Additional validation for 'in_progress' status
    if (status === 'in_progress') {
      // Check if any other item is already in_progress
      let inProgressItem: z.infer<typeof TodoItemSchema> | null = null;
      for (const [currentItemId, item] of Object.entries(todo.items)) {
        const todoItem = item as z.infer<typeof TodoItemSchema>;
        if (currentItemId !== itemId && todoItem.status === 'in_progress') {
          inProgressItem = todoItem;
          break;
        }
      }
      
      if (inProgressItem) {
        return {
          response: getErrorStatusResponseMessage(`Another item is already in progress: "${inProgressItem.content}". Only one item can be in progress at a time.`),
        };
      }

      // Check if all previous items in order are completed
      const itemIndex = todo.itemOrder.indexOf(itemId);
      if (itemIndex === -1) {
        return {
          response: getErrorStatusResponseMessage(`Item not found in todo order`),
        };
      }

      for (let i = 0; i < itemIndex; i++) {
        const previousItemId = todo.itemOrder[i];
        const previousItem = todo.items[previousItemId] as z.infer<typeof TodoItemSchema>;
        
        if (previousItem && previousItem.status !== 'completed') {
          return {
            response: getErrorStatusResponseMessage(`Previous item must be completed first: "${previousItem.content}". Items must be completed in order.`),
          };
        }
      }
    }

    chat.todos[id].items[itemId].status = status;
    await updateChat(chatId, chat);
    return {
      response: `Todo item status updated to: ${status}`,
    };
  }
});

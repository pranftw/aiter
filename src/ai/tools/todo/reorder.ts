import { tool } from 'ai';
import { z } from 'zod';
import { ToolContextSchema } from '@/lib/schema';
import { getTodo, updateChat } from '@/utils/chat';
import { getErrorStatusResponseMessage } from '@/utils/utils';


const reorderTodoItemsToolInputSchema = z.object({
  id: z.string().describe('ID of the todo list'),
  itemOrder: z.array(z.string()).describe('New order of item IDs for the todo list'),
});


const reorderTodoItemsToolOutputSchema = z.object({
  response: z.string(),
});


export const reorder_todo_items = tool({
  name: 'reorder_todo_items',
  description: `Reorder items in a todo list`,
  inputSchema: reorderTodoItemsToolInputSchema,
  outputSchema: reorderTodoItemsToolOutputSchema,
  execute: async ({id, itemOrder}, {experimental_context: context}) => {
    const {chatId} = context as z.infer<typeof ToolContextSchema>;
    const {result: {chat}, status: getTodoStatus, message: getTodoMessage} = await getTodo(chatId, id);
    if (getTodoStatus === 'error') {
      return {
        response: getTodoMessage,
      };
    }
    const currentItemIds = Object.keys(chat.todos[id].items);
    
    // Validate that all current item IDs are present in the new order
    const newOrderSet = new Set(itemOrder);
    const currentItemsSet = new Set(currentItemIds);
    
    if (newOrderSet.size !== currentItemsSet.size) {
      return {
        response: getErrorStatusResponseMessage('Item order length does not match current items count'),
      };
    }
    
    // Check if all current items are present in the new order
    for (const itemId of currentItemIds) {
      if (!newOrderSet.has(itemId)) {
        return {
          response: getErrorStatusResponseMessage(`Missing item ID in new order: ${itemId}`),
        };
      }
    }
    
    // Check if all new order items exist in current items
    for (const itemId of itemOrder) {
      if (!currentItemsSet.has(itemId)) {
        return {
          response: getErrorStatusResponseMessage(`Invalid item ID in new order: ${itemId}`),
        };
      }
    }
    
    // Update the item order
    chat.todos[id].itemOrder = itemOrder;
    await updateChat(chatId, chat);
    
    return {
      response: `Todo items reordered successfully!`,
    };
  }
});

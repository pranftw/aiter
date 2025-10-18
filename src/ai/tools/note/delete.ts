import { tool } from 'ai';
import { z } from 'zod';
import { ToolContextSchema } from '@/lib/schema';
import { getNote, updateChat } from '@/utils/chat';


const deleteNoteToolInputSchema = z.object({
  id: z.string().describe('ID of the note to delete'),
});


const deleteNoteToolOutputSchema = z.object({
  response: z.string(),
});


export const delete_note = tool({
  name: 'delete_note',
  description: `Delete a note`,
  inputSchema: deleteNoteToolInputSchema,
  outputSchema: deleteNoteToolOutputSchema,
  execute: async ({id}, {experimental_context: context}) => {
    const {chatId} = context as z.infer<typeof ToolContextSchema>;
    const {result: {chat}, status: getNoteStatus, message: getNoteMessage} = await getNote(chatId, id);
    if (getNoteStatus === 'error') {
      return {
        response: getNoteMessage,
      };
    }
    delete chat.notes[id];
    await updateChat(chatId, chat);
    return {
      response: `Note deleted!`,
    };
  }
});
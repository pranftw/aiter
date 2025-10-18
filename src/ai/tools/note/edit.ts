import { tool } from 'ai';
import { z } from 'zod';
import { ToolContextSchema } from '@/lib/schema';
import { getNote, updateChat } from '@/utils/chat';
import { getErrorStatusResponseMessage } from '@/utils/utils';


const editNoteToolInputSchema = z.object({
  id: z.string().describe('ID of the note to edit'),
  title: z.string().optional().describe('New title for the note'),
  content: z.string().optional().describe('New content for the note'),
});


const editNoteToolOutputSchema = z.object({
  response: z.string(),
});


export const edit_note = tool({
  name: 'edit_note',
  description: `Edit the title and/or content of a note. At least one of title or content must be provided.`,
  inputSchema: editNoteToolInputSchema,
  outputSchema: editNoteToolOutputSchema,
  execute: async ({id, title, content}, {experimental_context: context}) => {
    const {chatId} = context as z.infer<typeof ToolContextSchema>;
    
    // Validate that at least one field is provided
    if (!title && !content) {
      return {
        response: getErrorStatusResponseMessage('At least one of title or content must be provided'),
      };
    }
    
    const {result: {chat}, status: getNoteStatus, message: getNoteMessage} = await getNote(chatId, id);
    if (getNoteStatus === 'error') {
      return {
        response: getNoteMessage,
      };
    }
    
    // Update only the fields that were provided
    if (title !== undefined) {
      chat.notes[id].title = title;
    }
    if (content !== undefined) {
      chat.notes[id].content = content;
    }
    
    await updateChat(chatId, chat);
    return {
      response: `Note edited!`,
    };
  }
});
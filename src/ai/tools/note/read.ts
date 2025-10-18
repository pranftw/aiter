import { tool } from 'ai';
import { z } from 'zod';
import { NoteSchema, ToolContextSchema } from '@/lib/schema';
import { getNote } from '@/utils/chat';


const readNoteToolInputSchema = z.object({
  id: z.string().describe('ID of the note to retrieve')
});


const readNoteToolOutputSchema = z.object({
  note: NoteSchema.nullable(),
  response: z.string()
});


export const read_note = tool({
  name: 'read_note',
  description: `Read a note with its title and content`,
  inputSchema: readNoteToolInputSchema,
  outputSchema: readNoteToolOutputSchema,
  execute: async ({id}, {experimental_context: context}) => {
    const {chatId} = context as z.infer<typeof ToolContextSchema>;
    const {result: {note}, status: getNoteStatus, message: getNoteMessage} = await getNote(chatId, id);
    if (getNoteStatus === 'error') {
      return {
        note: null,
        response: getNoteMessage,
      }
    }
    return {
      note: note,
      response: getNoteMessage,
    }
  }
});
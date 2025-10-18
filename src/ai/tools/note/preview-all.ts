import { tool } from 'ai';
import { z } from 'zod';
import { ToolContextSchema } from '@/lib/schema';
import { getChat } from '@/utils/chat';


const NotePreviewSchema = z.object({
  id: z.string(),
  title: z.string(),
});


const previewAllNotesToolInputSchema = z.object({
  creatorId: z.string().optional().describe('toolCallId of the tool that created the notes.'),
});


const previewAllNotesToolOutputSchema = z.object({
  notes: z.array(NotePreviewSchema),
});


export const preview_all_notes = tool({
  name: 'preview_all_notes',
  description: `Get preview of all notes for the current chat. Returns only id and title for each note.`,
  inputSchema: previewAllNotesToolInputSchema,
  outputSchema: previewAllNotesToolOutputSchema,
  execute: async ({creatorId}, {experimental_context: context}) => {
    const {chatId} = context as z.infer<typeof ToolContextSchema>;
    const chat = await getChat(chatId);
    let notes = Object.values(chat.notes);
    if (creatorId) {
      notes = notes.filter(note => note.creatorId === creatorId);
    }
    const previewNotes = notes.map(note => ({
      id: note.id,
      title: note.title,
    }));
    return {
      notes: previewNotes,
    };
  }
});
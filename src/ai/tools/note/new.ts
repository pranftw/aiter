import { ToolContextSchema } from '@/lib/schema';
import { generateId, tool } from 'ai';
import { z } from 'zod';
import { getChat, updateChat } from '@/utils/chat';


const newNoteToolInputSchema = z.object({
  title: z.string().describe('Title of the note'),
  content: z.string().describe('Content of the note'),
});


const newNoteToolOutputSchema = z.object({
  response: z.string(),
});


export const new_note = tool({
  name: 'new_note',
  description: `Create a new note`,
  inputSchema: newNoteToolInputSchema,
  outputSchema: newNoteToolOutputSchema,
  execute: async ({title, content}, {experimental_context: context}) => {
    const {chatId, creatorId} = context as z.infer<typeof ToolContextSchema>;
    const noteId = generateId();
    const chat = await getChat(chatId);
    const note = {
      id: noteId,
      chatId: chatId,
      creatorId: creatorId,
      title: title,
      content: content,
    };
    chat.notes[noteId] = note;
    await updateChat(chatId, chat);
    return {
      response: `Note created with id: ${noteId}`,
    };
  }
});
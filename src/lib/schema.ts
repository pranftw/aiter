import { z } from "zod";
import { type UIMessage } from "ai";



export const TodoItemSchema = z.object({
  id: z.string(),
  status: z.enum(['pending', 'in_progress', 'completed']),
  content: z.string(),
});


export const TodoSchema = z.object({
  id: z.string(),
  chatId: z.string(),
  description: z.string(),
  items: z.record(z.string(), TodoItemSchema),
  itemOrder: z.array(z.string()),
});


export const SnippetSchema = z.object({
  id: z.string(),
  chatId: z.string(),
  description: z.string(),
  content: z.string(),
})


export const NoteSchema = z.object({
  id: z.string(),
  chatId: z.string(),
  creatorId: z.string().optional(),
  title: z.string(),
  content: z.string(),
});


export const ChatSchema = z.object({
  id: z.string(),
  agent: z.string(),
  messages: z.array(z.custom<UIMessage>()),
  todos: z.record(z.string(), TodoSchema),
  snippets: z.record(z.string(), SnippetSchema),
  notes: z.record(z.string(), NoteSchema),
});


export const ToolContextSchema = z.object({
  chatId: z.string(),
  writer: z.any(),
  agent: z.string(),
  creatorId: z.string().optional(),
  messages: z.array(z.custom<UIMessage>()),
});


export const SubagentToolCallStatusSchema = z.object({
  id: z.string(),
  toolName: z.string(),
  toolInput: z.any(),
});
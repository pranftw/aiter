import { z } from "zod";
import { type UIMessage } from "ai";


export const ChatSchema = z.object({
  id: z.string(),
  agent: z.string(),
  messages: z.array(z.custom<UIMessage>()).default([]),
  data: z.any()
});


export const ToolContextSchema = z.object({
  chatId: z.string(),
  writer: z.any(),
  agent: z.string(),
  messages: z.array(z.custom<UIMessage>()),
});


export const SubagentToolCallStatusSchema = z.object({
  id: z.string(),
  toolName: z.string(),
  toolInput: z.any(),
});
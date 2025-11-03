import path from 'path';
import { generateId } from 'ai';
import fs from 'fs';
import z from 'zod';
import { ChatSchema } from '@/lib/schema';
import { mcpManager } from './mcp-manager';
import type { MCPConfig } from '@/lib/types';



function getChatPath(chatId: string){
  return path.join(process.env.CHATS_PATH!, `${chatId}.json`);
}


export async function newChat(agent: string, dataSchema: z.ZodSchema){
  const chatId = generateId();
  const chatPath = getChatPath(chatId);
  fs.writeFileSync(chatPath, JSON.stringify(ChatSchema.parse({
    id: chatId,
    agent: agent,
    messages: [],
    data: dataSchema.parse(undefined)
  }), null, 2));
  return chatId;
}


export function getChatIds(){
  const chatsPath = path.join(process.env.CHATS_PATH!);
  const chats = fs.readdirSync(chatsPath).filter(chat => chat.endsWith('.json'));
  const chatIds = chats.map(chat => {
    return chat.replace('.json', '');
  });
  return chatIds;
}


export function getChat(chatId: string){
  const chatPath = getChatPath(chatId);
  const chat = fs.readFileSync(chatPath, 'utf8');
  const parsedChat = ChatSchema.parse(JSON.parse(chat));
  return parsedChat;
}


export function deleteChat(chatId: string){
  const chatPath = getChatPath(chatId);
  fs.unlinkSync(chatPath);
}


export function updateChat(chatId: string, chat: z.infer<typeof ChatSchema>){
  const chatPath = getChatPath(chatId);
  fs.writeFileSync(chatPath, JSON.stringify(chat, null, 2));
}


export function updateChatMessages(chatId: string, messages: z.infer<typeof ChatSchema>['messages']){
  const chat = getChat(chatId);
  chat.messages = messages;
  updateChat(chatId, chat);
}


export const initializeMCP = async (mcpConfig: MCPConfig) => {
  if (!mcpManager.isInitialized()) {
    await mcpManager.initialize(mcpConfig);
  }
};


export const initializeChat = async (chatId: string | null, agent: string, dataSchema: z.ZodSchema): Promise<z.infer<typeof ChatSchema> | null> => {
  if (!fs.existsSync(process.env.CHATS_PATH!)) {
    fs.mkdirSync(process.env.CHATS_PATH!);
  }
  let chat: z.infer<typeof ChatSchema> | null = null;
  if (!chatId) {
    const newChatId = await newChat(agent, dataSchema);
    chat = getChat(newChatId);
  }
  else {
    chat = getChat(chatId);
    if (chat.agent !== agent) {
      throw new Error(`Agent mismatch: Chat ${chatId} is for agent '${chat.agent}' but you are trying to access it with agent '${agent}'`);
    }
  }
  return chat;
};


export const cleanup = async () => {
  if (mcpManager.isInitialized()) {
    await mcpManager.cleanup();
  }
};


export function getPrompt(filepath: string){
  return fs.readFileSync(filepath, 'utf8');
}
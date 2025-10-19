import path from 'path';
import { generateId } from 'ai';
import fs from 'fs';
import z from 'zod';
import { ChatSchema } from '../lib/schema';
import { mcpManager } from "./mcp-manager";
import { getDataSchema, getMCPJSON } from "./ai";



function getChatPath(chatId: string){
  return path.join(process.env.CHATS_PATH!, `${chatId}.json`);
}


export async function newChat(agent: string){
  const chatId = generateId();
  const chatPath = getChatPath(chatId);
  const DataSchema = await getDataSchema(agent);
  fs.writeFileSync(chatPath, JSON.stringify(ChatSchema.parse({
    id: chatId,
    agent: agent,
    messages: [],
    data: DataSchema.parse(undefined)
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


export const initializeMCP = async (agent: string) => {
  if (!mcpManager.isInitialized()) {
    await mcpManager.initialize(getMCPJSON(agent, 'main'));
  }
};


export const initializeChat = async (chatId: string | null, agent: string): Promise<z.infer<typeof ChatSchema> | null> => {
  if (!fs.existsSync(process.env.CHATS_PATH!)) {
    fs.mkdirSync(process.env.CHATS_PATH!);
  }
  let chat: z.infer<typeof ChatSchema> | null = null;
  if (!chatId) {
    const chatId = await newChat(agent);
    chat = getChat(chatId);
  }
  else {
    chat = getChat(chatId);
  }
  return chat;
};


export const cleanup = async () => {
  if (mcpManager.isInitialized()) {
    await mcpManager.cleanup();
  }
};
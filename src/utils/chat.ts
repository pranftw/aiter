import path from 'path';
import { generateId } from 'ai';
import fs from 'fs';
import z from 'zod';
import { ChatSchema } from '../lib/schema';
import { StatusResponse } from './utils';



function getChatPath(chatId: string){
  return path.join(process.env.CHATS_PATH!, `${chatId}.json`);
}


export async function newChat(agent: string){
  const chatId = generateId();
  const chatPath = getChatPath(chatId);
  fs.writeFileSync(chatPath, JSON.stringify(ChatSchema.parse({
    id: chatId,
    agent: agent,
    messages: [],
    todos: {},
    snippets: {},
    notes: {},
  }), null, 2));
  return chatId;
}


export async function getChatIds(){
  const chatsPath = path.join(process.env.CHATS_PATH!);
  const chats = fs.readdirSync(chatsPath).filter(chat => chat.endsWith('.json'));
  const chatIds = chats.map(chat => {
    return chat.replace('.json', '');
  });
  return chatIds;
}


export async function getChat(chatId: string){
  const chatPath = getChatPath(chatId);
  const chat = fs.readFileSync(chatPath, 'utf8');
  const parsedChat = ChatSchema.parse(JSON.parse(chat));
  return parsedChat;
}


export async function deleteChat(chatId: string){
  const chatPath = getChatPath(chatId);
  fs.unlinkSync(chatPath);
}


export async function updateChat(chatId: string, chat: z.infer<typeof ChatSchema>){
  const chatPath = getChatPath(chatId);
  fs.writeFileSync(chatPath, JSON.stringify(chat, null, 2));
}


export async function updateChatMessages(chatId: string, messages: z.infer<typeof ChatSchema>['messages']){
  const chat = await getChat(chatId);
  chat.messages = messages;
  await updateChat(chatId, chat);
}


export async function getSnippet(chatId: string, snippetId: string){
  const chat = await getChat(chatId);
  if (!chat.snippets[snippetId]) {
    return StatusResponse(null, 'error', 'Snippet not found!');
  }
  return StatusResponse({chat: chat, snippet: chat.snippets[snippetId]}, 'success', 'Snippet found!');
}


export async function getTodo(chatId: string, todoId: string){
  const chat = await getChat(chatId);
  if (!chat.todos[todoId]) {
    return StatusResponse(null, 'error', 'Todo not found!');
  }
  return StatusResponse({chat: chat, todo: chat.todos[todoId]}, 'success', 'Todo found!');
}


export async function getTodoItem(chatId: string, todoId: string, itemId: string){
  const {result: {chat, todo}, status: getTodoStatus, message: getTodoMessage} = await getTodo(chatId, todoId);
  if (getTodoStatus === 'error') {
    return StatusResponse(null, 'error', getTodoMessage);
  }
  if (!todo.items[itemId]) {
    return StatusResponse(null, 'error', 'Todo item not found!');
  }
  return StatusResponse({chat: chat, todo: todo, todoItem: todo.items[itemId]}, 'success', 'Todo item found!');
}


export async function getNote(chatId: string, noteId: string){
  const chat = await getChat(chatId);
  if (!chat.notes[noteId]) {
    return StatusResponse(null, 'error', 'Note not found!');
  }
  return StatusResponse({chat: chat, note: chat.notes[noteId]}, 'success', 'Note found!');
}
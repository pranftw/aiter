import { ChatSchema } from "@/lib/schema";
import { z } from "zod";
import { mcpManager } from "./mcp-manager";
import { getMCPJSON } from "./ai";
import { newChat, getChat } from "./chat";
import path from "path";
import fs from "fs";



function StatusResponse(result: any, status: 'success' | 'error', message: string){
  return {
    result,
    status,
    message: status === 'success' ? getSuccessStatusResponseMessage(message) : getErrorStatusResponseMessage(message)
  };
}


export function getSuccessStatusResponseMessage(message: string){
  return `SUCCESS: ${message}`;
}


export function getErrorStatusResponseMessage(message: string){
  return `ERROR: ${message}`;
}


/**
 * Validates that a full file path is within the allowed base directory
 * Prevents directory traversal attacks
 */
export function validatePath(basePath: string, fpath: string): { isValid: boolean; response: string; } {
  // Get absolute canonical paths
  const resolvedBase = path.resolve(basePath);
  const resolvedFile = path.resolve(fpath);
  // Normalize paths to ensure consistent comparison
  const normalizedBase = path.normalize(resolvedBase) + path.sep;
  const normalizedFile = path.normalize(resolvedFile) + path.sep;
  // Check if the file path starts with the base directory path
  // This prevents access to parent directories or sibling directories
  const isValid = normalizedFile.startsWith(normalizedBase) || path.normalize(resolvedFile) === path.normalize(resolvedBase);
  if (isValid) {
    return {
      isValid: true,
      response: `Path validated!`
    };
  } else {
    return {
      isValid: false,
      response: `Access denied: Path '${fpath}' resolves to '${resolvedFile}' which is outside the allowed directory '${basePath}'`
    };
  }
}


export function createParentDirectories(fpath: string){
  const dirPath = path.dirname(fpath);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, {recursive: true});
  }
}


const initializeMCP = async (agent: string) => {
  if (!mcpManager.isInitialized()) {
    await mcpManager.initialize(getMCPJSON(agent, 'main'));
  }
};


const initializeChat = async (chatId: string | null, agent: string): Promise<z.infer<typeof ChatSchema> | null> => {
  if (!fs.existsSync(process.env.CHATS_PATH!)) {
    fs.mkdirSync(process.env.CHATS_PATH!);
  }
  let chat: z.infer<typeof ChatSchema> | null = null;
  if (!chatId) {
    const chatId = await newChat(agent);
    chat = await getChat(chatId);
  }
  else {
    chat = await getChat(chatId);
  }
  return chat;
};


const cleanup = async () => {
  if (mcpManager.isInitialized()) {
    await mcpManager.cleanup();
  }
};


export { StatusResponse, initializeMCP, cleanup, initializeChat };
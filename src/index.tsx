import 'dotenv/config';
import { render, useKeyboard } from '@opentui/react';
import { ChatContainer } from './components/chat/container';
import { ChatSchema } from './lib/schema';
import { initializeMCP, cleanup, initializeChat } from './utils/chat';
import { z } from 'zod';
import { processedArgs } from './utils/yargs';
import { getStreamFunction } from './utils/ai';
import type { StreamFunctionType } from './ai/custom-chat-transport';



interface AppProps {
  args: typeof processedArgs;
  chat: z.infer<typeof ChatSchema> | null;
  streamFunction: StreamFunctionType;
}


function App({ args, chat, streamFunction }: AppProps) {
  useKeyboard((key) => {
    if (key.name==='c' && key.ctrl) {
      cleanup();
      process.exit(0);
    }
  });
  if (chat) {
    return <ChatContainer chat={chat} streamFunction={streamFunction} prompt={args.prompt} />
  }
  return null;
}


async function main(args: typeof processedArgs){
  await initializeMCP(args.agent);
  const chat = await initializeChat(args.chatId, args.agent);
  const streamFunction = await getStreamFunction(args.agent);
  try {
    await render(<App args={args} chat={chat} streamFunction={streamFunction}/>, {exitOnCtrlC: false, enableMouseMovement: true});
  } catch (error) {
    await cleanup();
    console.error('Error:', error);
    process.exit(1);
  }
}

await main(processedArgs);
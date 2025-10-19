import 'dotenv/config';
import { render, useKeyboard } from '@opentui/react';
import { ChatContainer } from './components/chat/container';
import { ChatSchema } from './lib/schema';
import { initializeMCP, cleanup, initializeChat } from './utils/utils';
import { z } from 'zod';
import { processedArgs } from './utils/yargs';



interface AppProps {
  args: typeof processedArgs;
  chat: z.infer<typeof ChatSchema> | null;
}


function App({ args, chat }: AppProps) {
  useKeyboard((key) => {
    if (key.name==='c' && key.ctrl) {
      cleanup();
      process.exit(0);
    }
  });
  if (chat) {
    return <ChatContainer chat={chat} prompt={args.prompt} specName={args.specName} />
  }
  return null;
}


async function main(args: typeof processedArgs){
  try {
    await initializeMCP(args.agent);
    const chat = await initializeChat(args.chatId, args.agent);
    await render(<App args={args} chat={chat}/>, {exitOnCtrlC: false, enableMouseMovement: true});
  } catch (error) {
    await cleanup();
    console.error('Error:', error);
    process.exit(1);
  }
}

await main(processedArgs);
import 'dotenv/config';
import { render, useKeyboard } from '@opentui/react';
import { ChatContainer } from './components/chat/container';
import { ChatSchema } from './lib/schema';
import { initializeMCP, cleanup, initializeChat } from './utils/chat';
import { z } from 'zod';
import { processedArgs } from './utils/yargs';
import { getStreamFunction, getAIMessageComponent } from './utils/ai';
import type { StreamFunctionType } from './ai/custom-chat-transport';
import type { UIMessage } from 'ai';



interface AppProps {
  args: typeof processedArgs;
  chat: z.infer<typeof ChatSchema> | null;
  streamFunction: StreamFunctionType;
  AIMessageComponent: (props: { message: UIMessage }) => React.ReactElement;
}


function App({ args, chat, streamFunction, AIMessageComponent }: AppProps) {
  useKeyboard((key) => {
    if (key.name==='c' && key.ctrl) {
      cleanup();
      process.exit(0);
    }
  });
  if (chat) {
    return (
      <ChatContainer 
        chat={chat} 
        prompt={args.prompt} 
        streamFunction={streamFunction} 
        AIMessageComponent={AIMessageComponent} 
      />
    )
  }
  return null;
}


async function main(args: typeof processedArgs){
  await initializeMCP(args.agent);
  const chat = await initializeChat(args.chatId, args.agent);
  const streamFunction = await getStreamFunction(args.agent);
  const AIMessageComponent = await getAIMessageComponent(args.agent);
  try {
    await render(<App args={args} chat={chat} streamFunction={streamFunction} AIMessageComponent={AIMessageComponent}/>, {exitOnCtrlC: false, enableMouseMovement: true});
  } catch (error) {
    await cleanup();
    console.error('Error:', error);
    process.exit(1);
  }
}

await main(processedArgs);
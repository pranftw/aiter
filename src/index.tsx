import 'dotenv/config';
import { render } from 'ink';
import { ChatContainer } from './components/chat/container';
import { useEffect, useState, useRef } from 'react';
import { ChatSchema } from './lib/schema';
import { initializeMCP, cleanup, initializeChat } from './utils/utils';
import { z } from 'zod';
import { processedArgs } from './utils/yargs';



interface AppProps {
  args: typeof processedArgs;
}


function App({ args }: AppProps) {
  const hasInitialized = useRef(false);
  const [chat, setChat] = useState<z.infer<typeof ChatSchema> | null>(null);
  
  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      initializeChat(args.chatId, args.agent, setChat).catch(console.error);
      initializeMCP(args.agent).catch(console.error);
    }
    return () => {
      if (hasInitialized.current) {
        cleanup().catch(console.error);
      }
    };
  }, []);

  if (chat) {
    return <ChatContainer chat={chat} prompt={args.prompt} specName={args.specName} />
  }
  return null;
}

render(<App args={processedArgs}/>, {maxFps: 60})
import 'dotenv/config';
import { render, useKeyboard } from '@opentui/react';
import { 
  ChatContainer, 
  ChatSchema, 
  initializeMCP, 
  cleanup, 
  initializeChat,
  createAgentResolver,
  type StreamFunctionType,
  type AIMessageComponent
} from '@aiter/core';
import path from 'path';
import { z } from 'zod';
import { processedArgs } from './utils/yargs';

const agentResolver = createAgentResolver({
  basePath: path.join(process.cwd(), 'src/ai/agents')
});



interface AppProps {
  args: typeof processedArgs;
  chat: z.infer<typeof ChatSchema> | null;
  streamFunction: StreamFunctionType;
  AIMessageComponent: AIMessageComponent;
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
  const agent = await agentResolver.getAgent(args.agent);
  await initializeMCP(agent.mcpConfig);
  const chat = await initializeChat(args.chatId, args.agent, agent.dataSchema);
  const streamFunction = agent.streamFunction;
  const AIMessageComponent = agent.components.default;
  try {
    await render(<App args={args} chat={chat} streamFunction={streamFunction} AIMessageComponent={AIMessageComponent}/>, {exitOnCtrlC: false, enableMouseMovement: true});
  } catch (error) {
    await cleanup();
    console.error('Error:', error);
    process.exit(1);
  }
}

await main(processedArgs);
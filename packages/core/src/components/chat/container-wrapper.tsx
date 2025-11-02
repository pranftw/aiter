import { useMemo } from 'react';
import { z } from 'zod';
import { ChatSchema } from '@aiter/core/lib/schema';
import { type StreamFunctionType } from '@aiter/core/ai/custom-chat-transport';
import { ComponentsProvider, coreComponents, type CustomComponents } from '@aiter/core/components/context';

function validateCustomComponents(customComponents?: CustomComponents) {
  if (!customComponents) return;
  
  const validKeys = Object.keys(coreComponents);
  const providedKeys = Object.keys(customComponents);
  
  // Ensure ChatContainerWrapper cannot be customized
  if ('ChatContainerWrapper' in customComponents) {
    throw new Error(
      'ChatContainerWrapper cannot be customized. It handles the component provider system.'
    );
  }
  
  // Validate all provided keys are recognized components
  providedKeys.forEach(key => {
    if (!validKeys.includes(key)) {
      throw new Error(
        `Unknown component "${key}". Valid customizable components are: ${validKeys.join(', ')}`
      );
    }
  });
}

export interface ChatContainerWrapperProps {
  chat: z.infer<typeof ChatSchema>;
  prompt: string | null;
  streamFunction: StreamFunctionType;
  agentCommands?: Record<string, any>;
  customComponents?: CustomComponents;
}

export function ChatContainerWrapper({ chat, prompt, streamFunction, agentCommands, customComponents }: ChatContainerWrapperProps) {
  // Validate custom components
  validateCustomComponents(customComponents);
  
  // Merge core and custom components with memoization
  const mergedComponents = useMemo(
    () => ({ ...coreComponents, ...customComponents }),
    [customComponents]
  );
  
  // Get the ChatContainer from merged components (allows customization)
  const { ChatContainer } = mergedComponents;
  
  return (
    <ComponentsProvider value={mergedComponents}>
      <ChatContainer 
        chat={chat}
        prompt={prompt}
        streamFunction={streamFunction}
        agentCommands={agentCommands}
      />
    </ComponentsProvider>
  );
}


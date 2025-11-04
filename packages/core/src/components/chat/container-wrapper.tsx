import { useMemo } from 'react';
import { z } from 'zod';
import { ChatSchema } from '@/lib/schema';
import type { Agent } from '@/lib/types';
import { ComponentsProvider, coreComponents, type CustomComponents } from '@/components/context';

function validateCustomComponents(customComponents: CustomComponents) {
  // Ensure ChatContainerWrapper cannot be customized
  if ('ChatContainerWrapper' in customComponents) {
    throw new Error(
      'ChatContainerWrapper cannot be customized. It handles the component provider system.'
    );
  }
  
  // Only require ChatContainer - it uses other components internally
  if (!customComponents.ChatContainer) {
    throw new Error(
      'customComponents must include a ChatContainer component'
    );
  }
}

export interface ChatContainerWrapperProps {
  chat: z.infer<typeof ChatSchema>;
  prompt: string | null;
  agent: Agent;
  customComponents: CustomComponents;
}

export function ChatContainerWrapper({ chat, prompt, agent, customComponents }: ChatContainerWrapperProps) {
  // Validate custom components
  validateCustomComponents(customComponents);
  
  // Merge core and custom components with memoization
  const mergedComponents = useMemo(
    () => ({ ...coreComponents, ...customComponents }) as typeof coreComponents & CustomComponents,
    [customComponents]
  );
  
  // Get the ChatContainer from merged components (allows customization)
  const { ChatContainer } = mergedComponents;
  
  return (
    <ComponentsProvider value={mergedComponents}>
      <ChatContainer 
        chat={chat}
        prompt={prompt}
        agent={agent}
      />
    </ComponentsProvider>
  );
}


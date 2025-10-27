import { CustomChatTransport, type StreamFunctionType } from '@/ai/custom-chat-transport';
import { ChatBox } from './box';
import { ChatMessages } from './messages';
import { useChat } from '@ai-sdk/react';
import { ChatSchema } from '@/lib/schema';
import { z } from 'zod';
import { useEffect, useRef } from 'react';
import { ScrollBoxRenderable } from '@opentui/core';
import { colors } from '@/utils/colors';
import { useTriggerSystem } from '@/components/triggers/core/use-trigger-system';
import { triggerUIRegistry } from '@/components/triggers/registry';
import { ErrorOverlay } from '@/components/triggers/core/error-overlay';
import type { AIMessageComponent } from '@/lib/types';

interface ChatContainerProps {
  chat: z.infer<typeof ChatSchema>;
  prompt: string | null;
  streamFunction: StreamFunctionType;
  AIMessageComponent: AIMessageComponent;
  agentCommands?: Record<string, any>;
}

const prepareChat = (
  prompt: string | null,
  hasSentPrompt: { current: boolean },
  sendMessage: (message: { text: string }) => void
) => {
  if (prompt && !hasSentPrompt.current) {
    hasSentPrompt.current = true;
    sendMessage({ text: prompt });
  }
};

export function ChatContainer({ chat, prompt, streamFunction, AIMessageComponent, agentCommands }: ChatContainerProps) {
  const hasSentPrompt = useRef(false);
  const chatHook = useChat({
    id: chat.id,
    transport: new CustomChatTransport(streamFunction, [chat.id, chat.agent]),
    messages: chat.messages
  });
  const { messages, sendMessage } = chatHook;
  
  let scroll: ScrollBoxRenderable;
  const toBottom = () => {
    setTimeout(() => {
      if (scroll) {
        scroll.scrollTo(scroll.scrollHeight);
      }
    }, 0);
  };

  // Use the trigger system hook
  const { message, setMessage, handleSubmit, activeTriggerUI } = useTriggerSystem({
    chatHook,
    agent: chat.agent,
    agentCommands,
    onSubmitCallback: toBottom,
  });
  
  useEffect(() => {
    prepareChat(prompt, hasSentPrompt, sendMessage);
    toBottom();
  }, []);
  
  return (
    <box position='relative' flexDirection='column' gap={1} paddingLeft={2} paddingRight={2} paddingTop={1} paddingBottom={1}>
      <ascii-font text="aiter" flexShrink={0}/>
      {/* Header */}
      <box flexDirection='row' gap={2} flexWrap='wrap' flexShrink={0}>
        <text fg={colors.text.gray}><strong>CHAT</strong> {chat.id}</text>
        <text fg={colors.text.gray}><strong>AGENT</strong> {chat.agent}</text>
      </box>
      
      {/* Messages area */}
      <scrollbox 
        ref={(r) => { if (r) scroll = r; }} 
        stickyScroll={true} 
        stickyStart='bottom'
        flexGrow={1}
      >
        <ChatMessages messages={messages} AIMessageComponent={AIMessageComponent} />
      </scrollbox>

      {/* Render active trigger UI or error overlay */}
      {activeTriggerUI && (
        <box position='absolute' bottom={4} left={2} right={2}>
          {activeTriggerUI.error ? (
            <ErrorOverlay message={activeTriggerUI.error} onClose={activeTriggerUI.onClose} />
          ) : (
            triggerUIRegistry[activeTriggerUI.trigger.pattern]?.(activeTriggerUI)
          )}
        </box>
      )}

      {/* Generic ChatBox */}
      <box flexShrink={0}>
        <ChatBox 
          message={message}
          setMessage={setMessage}
          onSubmit={handleSubmit}
        />
      </box>
    </box>
  );
}
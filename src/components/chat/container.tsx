import { CustomChatTransport, type StreamFunctionType } from "@/ai/custom-chat-transport";
import { ChatBox, type TriggerState } from "./box";
import { ChatMessages } from "./messages";
import { useChat } from "@ai-sdk/react";
import type { UIMessage } from "ai";
import { ChatSchema } from "@/lib/schema";
import { z } from "zod";
import { useEffect, useRef, useState } from "react";
import { ScrollBoxRenderable } from "@opentui/core";
import { colors } from "@/utils/colors";
import { TriggerWindow } from "@/components/triggers/core";
import { CommandSuggestions } from "@/components/triggers/commands";

interface ChatContainerProps {
  chat: z.infer<typeof ChatSchema>;
  prompt: string | null;
  streamFunction: StreamFunctionType;
  AIMessageComponent: (props: { message: UIMessage }) => React.ReactElement;
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

export function ChatContainer({ chat, prompt, streamFunction, AIMessageComponent }: ChatContainerProps) {
  const hasSentPrompt = useRef(false);
  const [triggerState, setTriggerState] = useState<TriggerState | null>(null);
  const chatHook = useChat({
    id: chat.id,
    transport: new CustomChatTransport(streamFunction, [chat.id, chat.agent]),
    messages: chat.messages
  });
  const {messages, sendMessage} = chatHook;
  
  let scroll: ScrollBoxRenderable;
  const toBottom = () => {
    setTimeout(() => {
      if (scroll) {
        scroll.scrollTo(scroll.scrollHeight);
      }
    }, 0);
  };
  
  useEffect(() => {
    prepareChat(prompt, hasSentPrompt, sendMessage);
    toBottom();
  }, []);
  
  return (
    <box position='relative' flexDirection='column' gap={1} paddingLeft={2} paddingRight={2} paddingTop={1} paddingBottom={1}>
      <ascii-font text="aiter"/>
      {/* Header */}
      <box flexDirection='row' gap={2} flexWrap='wrap'>
        <text fg={colors.text.gray}><strong>CHAT</strong> {chat.id}</text>
        <text fg={colors.text.gray}><strong>AGENT</strong> {chat.agent}</text>
      </box>
      
      <box></box>
      
      {/* Messages area - takes all available space */}
      <box flexGrow={1}>
        <scrollbox 
          ref={(r) => { if (r) scroll = r; }} 
          stickyScroll={true} 
          stickyStart='bottom'
        >
          <ChatMessages messages={messages} AIMessageComponent={AIMessageComponent} />
        </scrollbox>
      </box>

      {/* Trigger window overlay - absolutely positioned above chatbox */}
      {triggerState && (
        <box position='absolute' bottom={4} left={2} right={2}>
          <TriggerWindow loading={triggerState.loading} error={triggerState.error}>
            {triggerState.trigger.pattern === '/' &&
              !triggerState.loading &&
              !(triggerState.query?.startsWith('/') && triggerState.query.slice(1).includes(' ')) && (
                <CommandSuggestions 
                  commands={triggerState.data} 
                  query={triggerState.query} 
                  onSelect={triggerState.onCommandSelect}
                  onClose={triggerState.onClose}
                />
              )}
          </TriggerWindow>
        </box>
      )}

      <ChatBox 
        chatHook={chatHook} 
        agent={chat.agent} 
        onSubmit={toBottom} 
        onTriggerStateChange={setTriggerState}
      />
    </box>
  );
}
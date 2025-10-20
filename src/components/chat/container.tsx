import { CustomChatTransport, type StreamFunctionType } from "@/ai/custom-chat-transport";
import { ChatBox } from "./box";
import { ChatMessages } from "./messages";
import { useChat } from "@ai-sdk/react";
import { ChatSchema } from "@/lib/schema";
import { z } from "zod";
import { useEffect, useRef } from "react";
import { ScrollBoxRenderable } from "@opentui/core";
import { colors } from "@/utils/colors";

interface ChatContainerProps {
  chat: z.infer<typeof ChatSchema>;
  streamFunction: StreamFunctionType;
  prompt: string | null;
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

export function ChatContainer({ chat, streamFunction, prompt }: ChatContainerProps) {
  const hasSentPrompt = useRef(false);
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
    <box flexDirection='column' gap={1} paddingLeft={2} paddingRight={2} paddingTop={1} paddingBottom={1}>
      {/* Header */}
      <text fg={colors.text.gray}>Chat: <strong>{chat.id}</strong></text>
      
      {/* Messages area - takes all available space */}
      <box flexGrow={1}>
        <scrollbox 
          ref={(r) => { if (r) scroll = r; }} 
          stickyScroll={true} 
          stickyStart='bottom'
        >
          <ChatMessages messages={messages} />
        </scrollbox>
      </box>
      
      <ChatBox chatHook={chatHook} onSubmit={toBottom} />
    </box>
  );
}
import { CustomChatTransport, type StreamFunctionType } from "@/ai/custom-chat-transport";
import { ChatBox } from "./box";
import { ChatMessages } from "./messages";
import { useChat } from "@ai-sdk/react";
import { ChatSchema } from "@/lib/schema";
import { z } from "zod";
import { useEffect, useRef } from "react";

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
  
  useEffect(() => {
    prepareChat(prompt, hasSentPrompt, sendMessage);
  }, []);
  
  return (
    <box flexDirection='column' height='100%' paddingLeft={2} paddingRight={2} paddingTop={1} paddingBottom={1}>
      {/* Header */}
      <box paddingTop={1} paddingBottom={1}>
        <text fg='#b0b0b0'>Chat: <strong>{chat.id}</strong></text>
      </box>
      
      {/* Messages area - takes all available space */}
      <box flexGrow={1}>
        <scrollbox>
          <ChatMessages messages={messages} />
        </scrollbox>
      </box>
      
      {/* Input box - fixed at bottom */}
      <box paddingTop={1} paddingBottom={1}>
        <ChatBox chatHook={chatHook} />
      </box>
    </box>
  );
}
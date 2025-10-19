import { CustomChatTransport } from "@/ai/custom-chat-transport";
import { ChatBox } from "./box";
import { ChatMessages } from "./messages";
import { useChat } from "@ai-sdk/react";
import { getStreamFunction } from "@/utils/ai";
import { ChatSchema } from "@/lib/schema";
import { z } from "zod";
import { useEffect, useRef } from "react";

interface ChatContainerProps {
  chat: z.infer<typeof ChatSchema>;
  prompt: string | null;
  specName: string | null;
}

const prepareChat = (
  prompt: string | null,
  specName: string | null,
  hasSentPrompt: { current: boolean },
  sendMessage: (message: { text: string }) => void
) => {
  if ((prompt || specName) && !hasSentPrompt.current) {
    hasSentPrompt.current = true;
    
    let message = '';
    
    // Add spec reference if provided
    if (specName) {
      message = `Implement based on the spec at specs/${specName}.md Use the read_file tool to read the spec.`;
    }
    
    // Append prompt if provided
    if (prompt) {
      if (message) {
        message += `\n\n${prompt}`;
      } else {
        message = prompt;
      }
    }
    
    sendMessage({ text: message });
  }
};

export function ChatContainer({ chat, prompt, specName }: ChatContainerProps) {
  const hasSentPrompt = useRef(false);
  const chatHook = useChat({
    id: chat.id,
    transport: new CustomChatTransport(getStreamFunction(chat.agent), [chat.id, chat.agent]),
    messages: chat.messages
  });
  const {messages, sendMessage} = chatHook;
  
  useEffect(() => {
    prepareChat(prompt, specName, hasSentPrompt, sendMessage);
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
        <ChatBox chatHook={chatHook} agent={chat.agent} />
      </box>
    </box>
  );
}
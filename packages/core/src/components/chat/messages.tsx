import { type UIMessage } from "ai"
import { UserMessage } from "./message/user"
import type { AIMessageComponent } from '@/lib/types';



interface ChatMessagesProps {
  messages: UIMessage[]
  AIMessageComponent: AIMessageComponent;
}

export function ChatMessages({ messages, AIMessageComponent }: ChatMessagesProps) {
  return (
    <box flexDirection='column' gap={1}>
      {messages.map((message: UIMessage, index) => 
        message.role === 'user' ? (
          <UserMessage message={message} />
        ) : (
          <AIMessageComponent message={message} />
        )
      )}
    </box>
  )
}
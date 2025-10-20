import { type UIMessage } from "ai"
import { UserMessage } from "./message/user"
import { AIMessage } from "./message/ai"



interface ChatMessagesProps {
  messages: UIMessage[]
}

export function ChatMessages({ messages }: ChatMessagesProps) {
  return (
    <box flexDirection='column' gap={1}>
      {messages.map((message: UIMessage, index) => (
        <box key={index}>
          {message.role === 'user' ? (
            <UserMessage message={message} />
          ) : (
            <AIMessage message={message} />
          )}
        </box>
      ))}
    </box>
  )
}
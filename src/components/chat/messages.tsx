import { type UIMessage } from "ai"
import { UserMessage } from "./message/user"



interface ChatMessagesProps {
  messages: UIMessage[]
  AIMessageComponent: (props: { message: UIMessage }) => React.ReactElement;
}

export function ChatMessages({ messages, AIMessageComponent }: ChatMessagesProps) {
  return (
    <box flexDirection='column' gap={1}>
      {messages.map((message: UIMessage, index) => (
        <box key={index}>
          {message.role === 'user' ? (
            <UserMessage message={message} />
          ) : (
            <AIMessageComponent message={message} />
          )}
        </box>
      ))}
    </box>
  )
}
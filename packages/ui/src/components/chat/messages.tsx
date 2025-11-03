import { type UIMessage } from 'ai'
import { useComponents } from '@aiter/ui/components/context'


export interface ChatMessagesProps {
  messages: UIMessage[]
}

export function ChatMessages({ messages }: ChatMessagesProps) {
  // Resolve components from context instead of imports
  const { AIMessage, UserMessage } = useComponents();
  
  return (
    <box flexDirection='column' gap={1}>
      {messages.map((message: UIMessage, index) => 
        message.role === 'user' ? (
          <UserMessage message={message} />
        ) : (
          <AIMessage message={message} />
        )
      )}
    </box>
  )
}
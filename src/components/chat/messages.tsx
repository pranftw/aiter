import { type UIMessage } from "ai"
import { UserMessage } from "./message/user"
import { AIMessage } from "./message/ai"
import React from "react"



interface ChatMessagesProps {
  messages: UIMessage[]
}

export function ChatMessages({ messages }: ChatMessagesProps) {
  return (
    <>
      {messages.map((message: UIMessage) => (
        <React.Fragment>
          {message.role==='user'?(
            <UserMessage message={message} />
          ):(
            <AIMessage message={message} />
          )}
        </React.Fragment>
      ))}
    </>
  )
}
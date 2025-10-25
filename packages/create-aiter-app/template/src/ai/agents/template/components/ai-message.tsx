import type { UIMessage } from 'ai';
import { AIMessage as DefaultAIMessage } from '@aiter/core';


interface AIMessageProps {
  message: UIMessage
}


export default function AIMessage({ message }: AIMessageProps) {
  return (
    <DefaultAIMessage message={message} />
  )
}
import type { UIMessage } from "ai";
import DefaultAIMessage from "@/components/chat/message/ai";


interface AIMessageProps {
  message: UIMessage
}


export default function AIMessage({ message }: AIMessageProps) {
  return (
    <DefaultAIMessage message={message} />
  )
}
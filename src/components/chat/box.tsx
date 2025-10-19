import { type useChat } from "@ai-sdk/react";
import { useState } from "react";

interface ChatBoxProps {
  chatHook: ReturnType<typeof useChat>;
  agent: string;
}

export function ChatBox({ chatHook, agent }: ChatBoxProps) {
  const { sendMessage, status } = chatHook;
  const [message, setMessage] = useState('');

  const handleSubmit = () => {
    if (status !== 'ready' || message.trim() === '') return;
    sendMessage({ text: message });
    setMessage('');
  };

  return (
    <input
      placeholder="Write a message"
      value={message}
      focused
      onInput={setMessage}
      onSubmit={handleSubmit}
    />
  )
}
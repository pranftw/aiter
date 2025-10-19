import { colors } from "@/utils/colors";
import { type useChat } from "@ai-sdk/react";
import { useState } from "react";

interface ChatBoxProps {
  chatHook: ReturnType<typeof useChat>;
}

export function ChatBox({ chatHook }: ChatBoxProps) {
  const { sendMessage, status } = chatHook;
  const [message, setMessage] = useState('');

  const handleSubmit = () => {
    if (status !== 'ready' || message.trim() === '') return;
    sendMessage({ text: message });
    setMessage('');
  };

  return (
    <input
      placeholder='Type a message...'
      value={message}
      focused
      onInput={setMessage}
      onSubmit={handleSubmit}
      backgroundColor={colors.background.primary}
    />
  )
}
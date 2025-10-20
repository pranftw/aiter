import { colors } from "@/utils/colors";
import { type useChat } from "@ai-sdk/react";
import { useState } from "react";

interface ChatBoxProps {
  chatHook: ReturnType<typeof useChat>;
  onSubmit?: () => void;
}

export function ChatBox({ chatHook, onSubmit }: ChatBoxProps) {
  const { sendMessage, status } = chatHook;
  const [message, setMessage] = useState('');

  const handleSubmit = () => {
    if (status !== 'ready' || message.trim() === '') return;
    sendMessage({ text: message });
    setMessage('');
    onSubmit?.();
  };

  return (
    <box margin={0} padding={2} paddingTop={1} backgroundColor={colors.background.secondary}>
      <input
        placeholder='Type a message...'
        value={message}
        focused
        onInput={setMessage}
        onSubmit={handleSubmit}
        onPaste={setMessage}
        backgroundColor={colors.background.secondary}
      />
    </box>
  )
}
import { type useChat } from "@ai-sdk/react";
import { useState } from "react";
import { colors } from "../../utils/colors";

interface ChatBoxProps {
  chatHook: ReturnType<typeof useChat>;
  agent: string;
}

export function ChatBox({ chatHook, agent }: ChatBoxProps) {
  const { sendMessage, status } = chatHook;
  const [message, setMessage] = useState('');

  const handleSubmit = async () => {
    if (status !== 'ready' || message.trim() === '') return;
    sendMessage({ text: message });
    setMessage('');
  };

  return (
    <box
      border
      borderColor={colors.border.primary}
      paddingLeft={2}
      paddingRight={2}
      marginTop={0.5}
      marginBottom={0.5}
    >
      <input
        placeholder="Write a message"
        focused
        onInput={setMessage}
        onSubmit={handleSubmit}
      />
    </box>
  )
}
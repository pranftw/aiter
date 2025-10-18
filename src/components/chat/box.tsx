import { type useChat } from "@ai-sdk/react";
import TextInput from "ink-text-input";
import { Box } from "ink";
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

  const handleInputChange = (value: string) => {
    setMessage(value);
  };

  return (
    <Box
      borderStyle="round"
      borderColor={colors.border.primary}
      paddingX={2}
      marginY={0.5}
    >
      <TextInput
        value={message}
        placeholder="Write a message"
        onChange={handleInputChange}
        focus={true}
        onSubmit={handleSubmit}
      />
    </Box>
  )
}
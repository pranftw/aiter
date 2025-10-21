import { colors } from '@/utils/colors';

interface ChatBoxProps {
  message: string;
  setMessage: (msg: string) => void;
  onSubmit: () => void;
  placeholder?: string;
}

export function ChatBox({ 
  message, 
  setMessage, 
  onSubmit, 
  placeholder = 'Write, / for commands' 
}: ChatBoxProps) {

  return (
    <box margin={0} padding={2} paddingTop={1} backgroundColor={colors.background.secondary}>
      <input
        placeholder={placeholder}
        value={message}
        focused
        onInput={setMessage}
        onSubmit={onSubmit}
        onPaste={setMessage}
        backgroundColor={colors.background.secondary}
      />
    </box>
  );
}
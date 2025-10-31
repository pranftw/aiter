import { colors } from '@/utils/colors';
import { useKeyboard } from '@opentui/react';

interface ErrorOverlayProps {
  message: string;
  onClose?: () => void;
}

export function ErrorOverlay({ message, onClose }: ErrorOverlayProps) {
  // Handle escape key to dismiss error
  useKeyboard((key) => {
    if (key.name === 'escape') {
      onClose?.();
    }
  });

  return (
    <box
      flexDirection='column'
      paddingLeft={2}
      paddingRight={2}
      paddingTop={1}
      paddingBottom={1}
      marginBottom={1}
      backgroundColor={colors.error.secondary}
    >
      <text fg={colors.error.primary}>
        {message.trim()}
      </text>
    </box>
  );
}


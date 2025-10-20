import { colors } from '@/utils/colors';

interface ErrorOverlayProps {
  error: {
    message: string;
    usage?: string;
    examples?: string[];
    commandName?: string;
  };
}

export function ErrorOverlay({ error }: ErrorOverlayProps) {
  return (
    <box
      flexDirection='column'
      borderTop
      borderStyle='single'
      borderColor={colors.status.error}
      paddingLeft={1}
      paddingRight={1}
      paddingTop={1}
      backgroundColor={colors.background.secondary}
    >
      <text fg={colors.status.error}>
        <strong>⚠ Error:</strong> {error.message}
      </text>

      {error.usage && (
        <box marginTop={1}>
          <text fg={colors.text.gray}>Usage: </text>
          <text fg={colors.text.code}>
            /{error.commandName}{error.usage ? ` ${error.usage}` : ''}
          </text>
        </box>
      )}

      {error.examples && error.examples.length > 0 && (
        <box flexDirection='column' marginTop={1}>
          <text fg={colors.text.gray}>Examples:</text>
          {error.examples.map((example, index) => (
            <box key={index} paddingLeft={1}>
              <text fg={colors.text.gray}>• </text>
              <text fg={colors.text.code}>
                /{error.commandName} {example}
              </text>
            </box>
          ))}
        </box>
      )}
    </box>
  );
}


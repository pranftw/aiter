import { colors } from '@/utils/colors';
import type { ReactNode } from 'react';
import { ErrorOverlay } from './error-overlay';

interface TriggerWindowProps {
  children: ReactNode;
  error?: {
    message: string;
    usage?: string;
    examples?: string[];
    commandName?: string;
  } | null;
  loading?: boolean;
}

export function TriggerWindow({ children, error, loading }: TriggerWindowProps) {
  return (
    <box
      flexDirection='column'
      gap={1}
      backgroundColor={colors.background.secondary}
      marginLeft={-2}
      marginRight={-2}
      marginTop={0}
      marginBottom={1}
      padding={2}
      paddingTop={1}
      minHeight={5}
    >
      {loading ? (
        <box flexDirection='column' style={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center' }}>
          <text fg={colors.text.gray}>Loading...</text>
        </box>
      ) : (
        <>
          <box flexGrow={1} flexDirection='column' alignItems='flex-start'>
            {children}
          </box>
          {error && <ErrorOverlay error={error} />}
        </>
      )}
    </box>
  );
}


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
      padding={2}
      paddingTop={1}
      maxHeight={'25%'}
    >
      {loading ? (
        <box flexDirection='column' style={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center' }}>
          <text fg={colors.text.gray}>Loading...</text>
        </box>
      ) : (
        <box flexDirection='column' gap={1}>
          {error && <ErrorOverlay error={error} />}
          <scrollbox flexGrow={1} flexDirection='column' alignItems='flex-start'>
            {children}
          </scrollbox>
        </box>
      )}
    </box>
  );
}


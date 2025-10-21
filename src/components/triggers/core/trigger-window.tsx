import { colors } from '@/utils/colors';
import type { ReactNode } from 'react';

interface TriggerWindowProps {
  children: ReactNode;
  loading?: boolean;
}

export function TriggerWindow({ children, loading }: TriggerWindowProps) {
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
        <scrollbox flexGrow={1} flexDirection='column' alignItems='flex-start'>
          {children}
        </scrollbox>
      )}
    </box>
  );
}


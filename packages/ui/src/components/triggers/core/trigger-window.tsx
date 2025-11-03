import { colors } from '@aiter/core';
import type { ReactNode } from 'react';

export interface TriggerWindowProps {
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
      paddingBottom={1}
      marginBottom={1}
    >
      {loading ? (
        <box flexDirection='column' style={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center' }}>
          <text fg={colors.text.gray}>Loading...</text>
        </box>
      ) : (
        <>
          {children}
        </>
      )}
    </box>
  );
}


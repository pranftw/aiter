import { CommandSuggestions } from '@/components/triggers/commands/suggestions';
import type { TriggerUIData } from '@/components/triggers/core/use-trigger-system';
import type { SlashCommand } from '@/triggers/commands/types';
import { TriggerWindow } from '@/components/triggers/core/trigger-window';
import type { ReactElement } from 'react';

const isCommandWithArgs = (query: string) => 
  query.startsWith('/') && query.slice(1).includes(' ');

// Command trigger UI component with self-describing pattern
export const CommandTriggerUI = {
  // The trigger pattern this component handles
  pattern: '/',
  
  // The render function for this trigger
  render: (triggerUI: TriggerUIData<SlashCommand>): ReactElement => {
    return (
      <TriggerWindow loading={triggerUI.loading}>
        {!triggerUI.loading && 
         !isCommandWithArgs(triggerUI.query) && (
          <CommandSuggestions 
            commands={triggerUI.data} 
            query={triggerUI.query} 
            onSelect={triggerUI.onSelect}
            onClose={triggerUI.onClose}
          />
        )}
      </TriggerWindow>
    ) as ReactElement;
  },
};


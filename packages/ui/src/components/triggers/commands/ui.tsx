import type { TriggerUIData } from '../core/use-trigger-system';
import type { SlashCommand } from '@aiter/core';
import { TriggerWindow } from '../core/trigger-window';
import { CommandSuggestions } from './suggestions';

const isCommandWithArgs = (query: string) => 
  query.startsWith('/') && query.slice(1).includes(' ');

export function CommandTriggerUI(triggerUI: TriggerUIData<SlashCommand>) {
  return (
    <TriggerWindow loading={triggerUI.loading}>
      {!triggerUI.loading && 
       !isCommandWithArgs(triggerUI.query) && (
        <CommandSuggestions 
          commands={triggerUI.data} 
          query={triggerUI.query} 
          onSelect={triggerUI.onSelect}
          onClose={triggerUI.onClose}
          onNavigate={triggerUI.onNavigate}
        />
      )}
    </TriggerWindow>
  );
}

import { useComponents, type TriggerUIData } from '@aiter/ui';
import type { SlashCommand } from '@aiter/core';

const isCommandWithArgs = (query: string) => 
  query.startsWith('/') && query.slice(1).includes(' ');

export function CommandTriggerUI(triggerUI: TriggerUIData<SlashCommand>) {
  const { TriggerWindow, CommandSuggestions } = useComponents();
  
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

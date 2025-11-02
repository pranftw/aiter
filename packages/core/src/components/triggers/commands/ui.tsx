import { useComponents } from '@aiter/core/components/context';
import type { TriggerUIData } from '@aiter/core/components/triggers/core/use-trigger-system';
import type { SlashCommand } from '@aiter/core/triggers/commands/types';

const isCommandWithArgs = (query: string) => 
  query.startsWith('/') && query.slice(1).includes(' ');

function CommandTriggerUIComponent(triggerUI: TriggerUIData<SlashCommand>) {
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

export const CommandTriggerUI = {
  pattern: '/',
  render: CommandTriggerUIComponent,
};

import type { TriggerUIData } from '@aiter/core/components/triggers/core/use-trigger-system';
import type { ReactElement } from 'react';
import { CommandTriggerUI } from '@aiter/core/components/triggers/commands/ui';

// Define the shape of a trigger UI component
export interface TriggerUIComponent {
  pattern: string;
  render: (triggerUI: TriggerUIData) => ReactElement | null;
}

// Array of all trigger UI components
// Each component self-describes which pattern it handles
const triggerUIComponents: TriggerUIComponent[] = [
  CommandTriggerUI,
  // Add more trigger UI components here as you create them:
  // MentionTriggerUI,
  // ActionTriggerUI,
];

// Automatically build the registry from the components array
export const triggerUIRegistry: Record<string, (triggerUI: TriggerUIData) => ReactElement | null> = 
  triggerUIComponents.reduce((registry, component) => {
    registry[component.pattern] = component.render;
    return registry;
  }, {} as Record<string, (triggerUI: TriggerUIData) => ReactElement | null>);


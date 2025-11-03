/**
 * Registry of core components available for customization
 * This file doesn't import React to avoid loading heavy dependencies in the CLI
 */
export const coreComponentsRegistry = {
  'chat/container': 'ChatContainer',
  'chat/messages': 'ChatMessages',
  'chat/box': 'ChatBox',
  'chat/message/ai': 'AIMessage',
  'chat/message/user': 'UserMessage',
} as const;

export type CoreComponentPath = keyof typeof coreComponentsRegistry;
export type CoreComponentName = typeof coreComponentsRegistry[CoreComponentPath];


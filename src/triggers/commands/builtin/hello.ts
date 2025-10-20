import type { SlashCommand } from '../types';

/**
 * Simple hello world command for testing
 */
export const helloCommand: SlashCommand = {
  name: 'hello',
  description: 'Say hello',
  usage: '[name]',
  examples: ['', 'World', 'Alice'],
  action: async (context) => {
    const name = context.args[0] || 'World';
    context.chatHook.sendMessage({
      text: `Hello ${name}! This is a test command.`,
    });
  },
};


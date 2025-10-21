import type { SlashCommand } from '../types';

/**
 * Simple hello world command with required name argument
 */
export const helloCommand: SlashCommand = {
  name: 'hello',
  description: 'Say hello to someone',
  usage: '--name <name>',
  examples: ['--name World', '--name Alice', '-n Bob'],
  options: {
    name: {
      type: 'string',
      alias: 'n',
      description: 'Name of the person to greet',
      demandOption: true,
      required: true,
    },
  },
  action: async (context) => {
    const name = context.args.name;
    
    context.chatHook.sendMessage({
      text: `Hello ${name}! This is a test command.`,
    });
  },
};


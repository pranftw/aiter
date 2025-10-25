import { input, checkbox } from '@inquirer/prompts';
import { getAllCapabilities, type Capability } from './capabilities/registry.js';

export async function promptForCapabilities(): Promise<Capability[]> {
  const allCapabilities = getAllCapabilities();

  const choices = allCapabilities.map(cap => ({
    name: cap,
    value: cap,
  }));

  const selected = await checkbox({
    message: 'Select capabilities to add:',
    choices,
  });

  return selected as Capability[];
}

export async function promptForAgentName(existingAgents: string[] = []): Promise<string> {
  const agentName = await input({
    message: 'Enter agent name:',
    validate: (value: string) => {
      if (!value) {
        return 'Agent name is required';
      }
      if (existingAgents.includes(value)) {
        return `Agent '${value}' already exists`;
      }
      return true;
    },
  });

  return agentName;
}

export async function promptForTargetAgent(agents: string[]): Promise<string> {
  const { select } = await import('@inquirer/prompts');
  
  const choices = [
    ...agents.map(agent => ({ name: agent, value: agent })),
    { name: 'All agents', value: '__all__' },
  ];

  const selected = await select({
    message: 'Which agent would you like to add capabilities to?',
    choices,
  });

  return selected;
}


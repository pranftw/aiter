import { input, checkbox } from '@inquirer/prompts';
import { getAllCustomizations, type Customization } from './customizations/registry';

export async function promptForCustomizations(): Promise<Customization[]> {
  const allCustomizations = getAllCustomizations();

  const choices = allCustomizations.map(custom => ({
    name: custom,
    value: custom,
  }));

  const selected = await checkbox({
    message: 'Select customizations to add:',
    choices,
  });

  return selected as Customization[];
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
    message: 'Which agent would you like to add customizations to?',
    choices,
  });

  return selected;
}


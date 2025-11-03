import { input, checkbox } from '@inquirer/prompts';
import chalk from 'chalk';
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

export async function promptForComponents(
  available: string[],
  existing: string[]
): Promise<string[]> {
  // Build hierarchical checkbox list with indentation
  // Group components by directory structure
  const choices = [];
  
  // Track which directories we've seen
  const seenDirs = new Set<string>();
  
  for (const componentPath of available) {
    // Extract directory path (e.g., 'chat/message/ai.tsx' -> 'chat' and 'chat/message')
    const parts = componentPath.split('/');
    
    // Add directory headers
    if (parts.length > 1 && parts[0]) {
      // Add parent directory if not seen
      const parentDir = parts[0];
      if (!seenDirs.has(parentDir)) {
        choices.push({
          name: `  ${chalk.cyan(parentDir + '/')}`,
          value: `__dir__${parentDir}`,
        });
        seenDirs.add(parentDir);
      }
      
      // If nested (e.g., chat/message/ai.tsx), add intermediate directory
      if (parts.length > 2) {
        const intermediateDir = parts.slice(0, -1).join('/');
        if (!seenDirs.has(intermediateDir)) {
          const immediateDir = parts[parts.length - 2];
          choices.push({
            name: `    ${chalk.cyan(immediateDir + '/')}`,
            value: `__dir__${intermediateDir}`,
          });
          seenDirs.add(intermediateDir);
        }
      }
    }
    
    // Add the file itself with appropriate indentation
    const indent = parts.length === 1 ? '' : parts.length === 2 ? '    ' : '      ';
    const fileName = parts[parts.length - 1];
    const isExisting = existing.includes(componentPath);
    
    choices.push({
      name: `${indent}${fileName}`,
      value: componentPath,
      checked: isExisting, // Pre-check existing files
    });
  }

  const selected = await checkbox({
    message: 'Select components to customize:',
    choices,
    pageSize: 20,
  });

  // Expand directory selections to include all files within them
  const expandedSelection = new Set<string>();
  
  for (const selection of selected) {
    if (selection.startsWith('__dir__')) {
      // Extract directory path from value
      const dirPath = selection.replace('__dir__', '');
      
      // Add all files in this directory (and subdirectories)
      // Include existing files - they will be prompted for overwrite in copyComponents
      for (const componentPath of available) {
        if (componentPath.startsWith(dirPath + '/')) {
          expandedSelection.add(componentPath);
        }
      }
    } else {
      // Regular file selection
      expandedSelection.add(selection);
    }
  }

  return Array.from(expandedSelection);
}


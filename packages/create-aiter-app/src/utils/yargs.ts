import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { resolveCapabilities, validateCapabilities, type Capability } from '../capabilities/registry.js';

const argv = yargs(hideBin(process.argv))
  .option('path', {
    alias: 'p',
    type: 'string',
    description: 'Target directory path',
    default: '.',
  })
  .option('name', {
    alias: 'n',
    type: 'string',
    description: 'Project name',
    demandOption: true,
  })
  .option('agent', {
    alias: 'a',
    type: 'string',
    description: 'Agent name (enables capability system)',
  })
  .option('capabilities', {
    alias: 'c',
    type: 'array',
    description: 'Capabilities to include (commands, tools, mcps, system-prompts, components, all)',
  })
  .option('interactive', {
    alias: 'i',
    type: 'boolean',
    description: 'Interactive mode',
    default: true,
  })
  .help('h')
  .alias('h', 'help')
  .parseSync();

type ExtendedArguments = typeof argv & {
  capabilities: Capability[];
  isDevWorkspace: boolean;
  shouldPromptCapabilities: boolean;
};

const processArgs = (rawArgs: typeof argv): ExtendedArguments => {
  // Detect if this is dev workspace
  const isDevWorkspace = rawArgs.path === '.' && rawArgs.name === 'dev';

  // Only process capabilities if --agent is specified
  let capabilities: Capability[] = [];
  let shouldPromptCapabilities = false;
  
  if (rawArgs.agent) {
    const hasExplicitCapabilities = rawArgs.capabilities !== undefined;
    
    if (hasExplicitCapabilities) {
      // User explicitly specified capabilities, use them
      const requestedCapabilities = rawArgs.capabilities as string[];
      capabilities = resolveCapabilities(requestedCapabilities);
      
      const { valid, invalid } = validateCapabilities(capabilities);
      
      if (invalid.length > 0) {
        console.error(`Error: Unknown capabilities: ${invalid.join(', ')}`);
        process.exit(1);
      }
      
      capabilities = valid;
      shouldPromptCapabilities = false;
    } else {
      // No explicit capabilities provided
      if (rawArgs.interactive) {
        // Interactive mode and no explicit capabilities = prompt
        shouldPromptCapabilities = true;
      } else {
        // Non-interactive mode, use defaults
        const defaultCapabilities = isDevWorkspace ? ['all'] : [];
        capabilities = resolveCapabilities(defaultCapabilities);
        
        const { valid, invalid } = validateCapabilities(capabilities);
        
        if (invalid.length > 0) {
          console.error(`Error: Unknown capabilities: ${invalid.join(', ')}`);
          process.exit(1);
        }
        
        capabilities = valid;
        shouldPromptCapabilities = false;
      }
    }
  }

  return {
    ...rawArgs,
    capabilities,
    isDevWorkspace,
    shouldPromptCapabilities,
  };
};

export const args = processArgs(argv);


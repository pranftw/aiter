import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { resolveCapabilities, validateCapabilities, type Capability } from '../capabilities/registry.js';

const argv = yargs(hideBin(process.argv))
  .option('type', {
    alias: 't',
    type: 'string',
    description: 'Creation type: "app" or "agent"',
    choices: ['app', 'agent'],
    demandOption: true,
  })
  .option('path', {
    alias: 'p',
    type: 'string',
    description: 'Target directory path',
    default: '.',
  })
  .option('name', {
    alias: 'n',
    type: 'string',
    description: 'Project name (for app) or agent name (for agent)',
    demandOption: true,
  })
  .option('capabilities', {
    alias: 'c',
    type: 'array',
    description: 'Capabilities to include (agent only: commands, tools, mcps, system-prompts, components, all)',
  })
  .option('interactive', {
    alias: 'i',
    type: 'boolean',
    description: 'Interactive mode (agent only)',
  })
  .check((argv) => {
    // Validate based on type
    if (argv.type === 'app') {
      // For app: disallow capabilities and interactive
      if (argv.capabilities) {
        throw new Error('--capabilities can only be used with --type "agent"');
      }
      if (argv.interactive !== undefined && argv.interactive !== true) {
        throw new Error('--interactive can only be used with --type "agent"');
      }
    } else if (argv.type === 'agent') {
      // For agent: capabilities and interactive are allowed
      if (argv.interactive === undefined) {
        argv.interactive = true;
      }
    }
    return true;
  })
  .help('h')
  .alias('h', 'help')
  .parseSync();

type ExtendedArguments = typeof argv & {
  type: 'app' | 'agent';
  path: string;
  capabilities: Capability[];
  isDevWorkspace: boolean;
  shouldPromptCapabilities: boolean;
};

const processArgs = (rawArgs: typeof argv): ExtendedArguments => {
  // Ensure path has a value
  const finalPath = rawArgs.path || '.';
  
  // Detect if this is dev workspace
  const isDevWorkspace = finalPath === '.' && rawArgs.name === 'dev';

  let capabilities: Capability[] = [];
  let shouldPromptCapabilities = false;
  
  // For agent type, process capabilities
  if (rawArgs.type === 'agent') {
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
      const interactive = rawArgs.interactive ?? true;
      if (interactive) {
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
    type: rawArgs.type as 'app' | 'agent',
    path: finalPath,
    capabilities,
    isDevWorkspace,
    shouldPromptCapabilities,
  };
};

export const args = processArgs(argv);

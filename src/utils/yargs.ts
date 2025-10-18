import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import fs from 'fs';
import path from 'path';



const readStdin = (): string | null => {
  try {
    // Check if stdin is being piped (not a TTY)
    if (!process.stdin.isTTY) {
      return fs.readFileSync(0, 'utf8');
    }
  } catch (error) {
    console.error('Error reading from stdin:', error);
  }
  return null;
};


export const argv = yargs(hideBin(process.argv))
  .option('agent', {
    alias: 'a',
    type: 'string',
    choices: ['scribe', 'elucidator'],
    description: 'Agent name',
    default: 'scribe'
  })
  .option('chat', {
    alias: 'c',
    type: 'string',
    description: 'Chat session',
    default: null
  })
  .option('prompt', {
    alias: 'p',
    type: 'string',
    description: 'Prompt string',
    default: null
  })
  .option('spec', {
    alias: 's',
    type: 'string',
    description: 'Spec file path',
    default: null
  })
  .help('h')
  .alias('h', 'help')
  .parseSync();


type ExtendedArguments = typeof argv & {
  chatId: string | null;
  specName: string | null;
};


const processArgs = (args: typeof argv): ExtendedArguments => {
  // Check if '-' is in any positional argument
  const hasDashArg = args._.some(arg => arg?.toString() === '-');
  const hasPromptOption = args.prompt !== null;
  // Validate that both prompt and '-' are not specified together
  if (hasDashArg && hasPromptOption) {
    console.error('Error: Cannot specify both --prompt and - at the same time');
    process.exit(1);
  }
  if (hasDashArg) {
    args.prompt = readStdin();
  }
  
  // Validate that spec is only specified for scribe agent
  if (args.spec !== null && args.agent !== 'scribe') {
    console.error('Error: --spec can only be used with the scribe agent');
    process.exit(1);
  }
  
  const extendedArgs = {...args};
  if (args.chat) {
    const fname = args.chat.split('/').pop();
    if (fname?.endsWith('.json')) {
      extendedArgs.chatId = fname.replace('.json', '');
    }
    else {
      extendedArgs.chatId = null;
    }
  }
  
  // Extract specName from spec path
  if (args.spec) {
    const basename = path.basename(args.spec);
    extendedArgs.specName = basename.replace(path.extname(basename), '');
  } else {
    extendedArgs.specName = null;
  }
  
  return extendedArgs as ExtendedArguments;
};


export const processedArgs = processArgs(argv);
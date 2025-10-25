import yargs from 'yargs';
import type { SlashCommand, ParsedCommandArgs } from './types';

/**
 * Check if input is a slash command
 * Excludes comment patterns like // and /*
 */
export function isSlashCommand(input: string): boolean {
  if (!input || typeof input !== 'string') {
    return false;
  }
  return input.startsWith('/') && !input.startsWith('//') && !input.startsWith('/*');
}

/**
 * Parse command arguments from a string using yargs
 */
export function parseCommandArgs(command: SlashCommand, argsString: string): ParsedCommandArgs {
  // If no options are defined, return empty object as success
  if (!command.options) {
    return { success: true, args: {} };
  }

  // Split args string into array, handling quoted strings
  const args = argsString.trim() === '' ? [] : parseArgsString(argsString);
  
  try {
    // Create yargs parser with command options
    const parser = yargs()
      .help(false) // Disable default help to avoid conflicts
      .exitProcess(false) // Prevent yargs from exiting the process
      .showHelpOnFail(false) // Don't show help on failure
      .strict(); // Enable strict mode to catch unknown options

    // Add each option to the parser
    Object.entries(command.options).forEach(([key, option]) => {
      parser.option(key, option);
      
      // Handle required options
      if (option.demandOption === true || option.required === true) {
        parser.demandOption(key, option.description || `${key} is required`);
      }
    });

    // Parse the arguments (cast to synchronous result)
    const parsed = parser.parse(args) as any;
    
    // Remove yargs internal properties
    const { _, $0, ...cleanArgs } = parsed;
    
    return { 
      success: true, 
      args: { ...cleanArgs, _: _ || [] }
    };
  } catch (error) {
    // Extract meaningful error message from yargs error
    let errorMessage = error instanceof Error ? error.message : 'Invalid arguments';
    
    // Clean up yargs error messages
    if (errorMessage.includes('Missing required argument')) {
      errorMessage = errorMessage.replace('Missing required argument:', 'Missing required option:');
    }
    
    return { 
      success: false, 
      error: errorMessage 
    };
  }
}

/**
 * Parse args string into array, handling quoted strings
 */
function parseArgsString(argsString: string): string[] {
  const args: string[] = [];
  let current = '';
  let inQuotes = false;
  let quoteChar = '';
  
  for (let i = 0; i < argsString.length; i++) {
    const char = argsString[i];
    
    if (!inQuotes && (char === '"' || char === "'")) {
      inQuotes = true;
      quoteChar = char;
    } else if (inQuotes && char === quoteChar) {
      inQuotes = false;
      quoteChar = '';
    } else if (!inQuotes && char === ' ') {
      if (current.trim()) {
        args.push(current.trim());
        current = '';
      }
    } else {
      current += char;
    }
  }
  
  if (current.trim()) {
    args.push(current.trim());
  }
  
  return args;
}


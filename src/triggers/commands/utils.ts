import type { SlashCommand, ParsedCommandArgs } from './types';

/**
 * Check if input is a slash command
 */
export function isSlashCommand(input: string): boolean {
  if (!input || typeof input !== 'string') {
    return false;
  }
  return input.startsWith('/');
}

/**
 * Parse command arguments from a string
 * Simple space-based splitting for now (can be enhanced with yargs later)
 */
export function parseCommandArgs(command: SlashCommand, argsString: string): ParsedCommandArgs {
  // If no args provided
  if (!argsString || argsString.trim() === '') {
    return {
      success: true,
      args: [],
    };
  }

  // Simple space-based splitting
  // Future enhancement: use yargs or similar for complex parsing
  const args = argsString.trim().split(/\s+/);

  return {
    success: true,
    args,
  };
}


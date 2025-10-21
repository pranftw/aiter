import type { TriggerContext } from '../core/types';

/**
 * Slash command definition
 */
export interface SlashCommand {
  /** Command name (e.g., 'help', 'clear') */
  name: string;
  
  /** Alternative names for the command */
  aliases?: string[];
  
  /** Brief description of what the command does */
  description: string;
  
  /** Usage pattern (e.g., '<message>' or '[options]') */
  usage?: string;
  
  /** Example usage strings */
  examples?: string[];
  
  /** Command action to execute */
  action: (context: CommandContext) => Promise<void> | void;
}

/**
 * Context passed to command actions during execution
 */
export interface CommandContext extends TriggerContext {
  /** The command name that was invoked */
  commandName: string;
  
  /** Parsed arguments (simple for now, array of strings) */
  args: string[];
  
  /** Raw arguments string */
  argsString: string;
  
  /** Current agent type */
  agent: string;
}

/**
 * Result of command execution
 */
export interface CommandExecuteResult {
  /** Whether this was a command */
  wasCommand: boolean;
  
  /** Whether execution was successful */
  success?: boolean;
  
  /** Error message if execution failed */
  error?: string;
  
  /** Command usage pattern (for error display) */
  usage?: string;
  
  /** Command examples (for error display) */
  examples?: string[];
  
  /** The command name that was executed */
  commandName?: string;
}

/**
 * Parsed command arguments result
 */
export interface ParsedCommandArgs {
  /** Whether parsing was successful */
  success: boolean;
  
  /** Parsed arguments array */
  args: string[];
  
  /** Error message if parsing failed */
  error?: string;
}


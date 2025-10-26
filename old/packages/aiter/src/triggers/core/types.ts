import type { ChatHook } from '@/lib/types';

/**
 * Trigger matching mode
 * - 'positional': Trigger must be at the start of input (e.g., commands)
 * - 'inline': Trigger can appear anywhere in input (e.g., context, mentions)
 */
export type TriggerMode = 'positional' | 'inline';

/**
 * Base interface that all triggers must implement
 */
export interface TriggerDefinition {
  /** The pattern that activates this trigger (e.g., '/', '@', '!') */
  pattern: string;
  
  /** Priority for matching when multiple triggers could match (higher = checked first) */
  priority: number;
  
  /** Matching mode - positional (start only) or inline (anywhere) */
  mode?: TriggerMode; // Defaults to 'positional' for backward compatibility
  
  /** Check if the input matches this trigger pattern */
  matches(input: string): boolean;
  
  /** Parse the input to extract trigger-specific information */
  parse(input: string): ParsedTrigger;
  
  /** Get suggestions for the current input */
  getSuggestions(input: string): Promise<any[]>;
  
  /** Execute the trigger action */
  execute(context: TriggerContext): Promise<TriggerResult>;
}

/**
 * Context passed to triggers during execution
 */
export interface TriggerContext {
  /** The chat hook from @ai-sdk/react */
  chatHook: ChatHook;
  
  /** The raw input string */
  rawInput: string;
  
  /** The trigger character that was matched */
  triggerChar: string;
  
  /** Additional metadata (e.g., agent, workspace path) */
  metadata?: Record<string, any>;
}

/**
 * Result returned from trigger execution
 */
export interface TriggerResult {
  /** Whether a trigger was activated */
  wasTriggered: boolean;
  
  /** Whether the trigger execution was successful */
  success?: boolean;
  
  /** Error message if execution failed */
  error?: string;
  
  /** Additional data returned by the trigger */
  data?: any;
}

/**
 * UI state for trigger components
 */
export interface TriggerState {
  /** List of suggestions to display */
  suggestions?: any[];
  
  /** Currently selected suggestion index */
  selectedIndex?: number;
  
  /** Error message to display */
  error?: string;
  
  /** Error context for detailed error display */
  errorContext?: any;
  
  /** Whether the trigger is currently executing */
  executing?: boolean;
  
  /** Execution-specific data (e.g., for shell output) */
  executionData?: any;
}

/**
 * Parsed trigger information
 */
export interface ParsedTrigger {
  /** The trigger character */
  triggerChar: string;
  
  /** The command/identifier after the trigger */
  command: string;
  
  /** Arguments/parameters after the command */
  args: string;
  
  /** The search query (for suggestions) */
  query: string;
}

/**
 * A single trigger occurrence within text
 */
export interface TriggerOccurrence {
  /** The trigger pattern that was matched */
  pattern: string;
  
  /** Start position of the trigger in the input */
  startIndex: number;
  
  /** End position of the trigger content (including any identifier/args) */
  endIndex: number;
  
  /** The full trigger text (e.g., '@context' or '/command args') */
  content: string;
  
  /** The identifier/command after the trigger character */
  identifier: string;
  
  /** Any additional text after the identifier */
  args?: string;
}

/**
 * Result of parsing input for all trigger occurrences
 */
export interface MultiTriggerParseResult {
  /** Original input text */
  originalInput: string;
  
  /** All trigger occurrences found in the input */
  occurrences: TriggerOccurrence[];
  
  /** Input with all triggers removed/replaced */
  cleanedInput: string;
  
  /** Whether any triggers were found */
  hasTriggers: boolean;
}


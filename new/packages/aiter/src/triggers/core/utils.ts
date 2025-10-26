import type { ParsedTrigger, TriggerOccurrence, MultiTriggerParseResult, TriggerMode } from './types';

/**
 * Check if input starts with a trigger pattern (for positional triggers)
 */
export function isTriggerPattern(input: string, pattern: string): boolean {
  if (!input || !pattern) {
    return false;
  }
  return input.startsWith(pattern);
}

/**
 * Check if input contains a trigger pattern anywhere (for inline triggers)
 */
export function containsTriggerPattern(input: string, pattern: string): boolean {
  if (!input || !pattern) {
    return false;
  }
  return input.includes(pattern);
}

/**
 * Check if input matches a trigger pattern based on mode
 */
export function matchesTriggerPattern(
  input: string, 
  pattern: string, 
  mode: TriggerMode = 'positional'
): boolean {
  if (mode === 'inline') {
    return containsTriggerPattern(input, pattern);
  }
  return isTriggerPattern(input, pattern);
}

/**
 * Parse input to extract trigger information
 * Example: "/hello world" -> { triggerChar: '/', command: 'hello', args: 'world', query: 'hello' }
 */
export function parseInput(input: string, pattern: string): ParsedTrigger {
  // Remove the trigger pattern from the beginning
  const withoutTrigger = input.slice(pattern.length);

  // Split into command and args
  const parts = withoutTrigger.split(' ');
  const command = parts[0] || '';
  const args = parts.slice(1).join(' ');

  return {
    triggerChar: pattern,
    command,
    args,
    query: command, // For simple cases, query is the command name
  };
}

/**
 * Find all occurrences of a trigger pattern in the input
 * Extracts the identifier and any arguments after each trigger
 * 
 * Example: "Check @file1 and @file2 for issues" with pattern "@"
 * Returns: [
 *   { pattern: '@', startIndex: 6, endIndex: 12, content: '@file1', identifier: 'file1', args: '' },
 *   { pattern: '@', startIndex: 17, endIndex: 23, content: '@file2', identifier: 'file2', args: '' }
 * ]
 */
export function findTriggerOccurrences(input: string, pattern: string): TriggerOccurrence[] {
  if (!input || !pattern) {
    return [];
  }

  const occurrences: TriggerOccurrence[] = [];
  let searchIndex = 0;

  while (searchIndex < input.length) {
    const index = input.indexOf(pattern, searchIndex);
    if (index === -1) {
      break;
    }

    // Extract the identifier after the trigger
    // An identifier consists of alphanumeric characters, underscores, hyphens, dots, and slashes
    let endIndex = index + pattern.length;
    let identifier = '';
    
    // Read identifier characters
    while (endIndex < input.length) {
      const char = input[endIndex];
      if (!char || !/[a-zA-Z0-9_\-./]/.test(char)) break;
      identifier += char;
      endIndex++;
    }

    // Skip any whitespace after identifier
    const argsStart = endIndex;
    while (endIndex < input.length && input[endIndex] === ' ') {
      endIndex++;
    }

    // Read arguments until next trigger or end of line/input
    let args = '';
    let argEndIndex = endIndex;
    while (argEndIndex < input.length && input[argEndIndex] !== '\n') {
      // Check if we hit another trigger pattern
      if (input.substring(argEndIndex).startsWith(pattern)) {
        break;
      }
      args += input[argEndIndex];
      argEndIndex++;
    }

    args = args.trim();
    const finalEndIndex = args ? argEndIndex : argsStart;

    const content = input.substring(index, finalEndIndex).trim();

    occurrences.push({
      pattern,
      startIndex: index,
      endIndex: finalEndIndex,
      content,
      identifier,
      args: args || undefined,
    });

    searchIndex = index + 1; // Move past this trigger to find next one
  }

  return occurrences;
}

/**
 * Parse input to extract all trigger occurrences for a given pattern
 * Returns the original input, all occurrences, and a cleaned version with triggers removed
 */
export function parseMultiTriggerInput(input: string, pattern: string): MultiTriggerParseResult {
  const occurrences = findTriggerOccurrences(input, pattern);
  
  let cleanedInput = input;
  // Remove triggers from end to start to preserve indices
  for (let i = occurrences.length - 1; i >= 0; i--) {
    const occ = occurrences[i];
    if (occ) {
      cleanedInput = 
        cleanedInput.substring(0, occ.startIndex) + 
        cleanedInput.substring(occ.endIndex);
    }
  }
  
  // Clean up extra whitespace
  cleanedInput = cleanedInput.replace(/\s+/g, ' ').trim();

  return {
    originalInput: input,
    occurrences,
    cleanedInput,
    hasTriggers: occurrences.length > 0,
  };
}

/**
 * Fuzzy search helper - scores how well a string matches a query
 * Returns a score between 0-100 (higher is better)
 */
export function fuzzyScore(text: string, query: string): number {
  if (!query) {
    return 0;
  }

  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();

  // Exact match
  if (lowerText === lowerQuery) {
    return 100;
  }

  // Starts with query
  if (lowerText.startsWith(lowerQuery)) {
    return 80;
  }

  // Contains query
  if (lowerText.includes(lowerQuery)) {
    return 60;
  }

  // Check for character-by-character match (fuzzy)
  let queryIndex = 0;
  for (let i = 0; i < lowerText.length && queryIndex < lowerQuery.length; i++) {
    if (lowerText[i] === lowerQuery[queryIndex]) {
      queryIndex++;
    }
  }

  if (queryIndex === lowerQuery.length) {
    return 40; // All characters found in order
  }

  return 0;
}


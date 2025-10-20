import type { ParsedTrigger } from './types';

/**
 * Check if input starts with a trigger pattern
 */
export function isTriggerPattern(input: string, pattern: string): boolean {
  if (!input || !pattern) {
    return false;
  }
  return input.startsWith(pattern);
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


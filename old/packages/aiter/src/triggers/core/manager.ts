import type { TriggerDefinition, TriggerContext, TriggerResult, MultiTriggerParseResult } from './types';
import { parseMultiTriggerInput } from './utils';

/**
 * Orchestrates multiple triggers and routes input to the appropriate one
 */
export class TriggerManager {
  private triggers: TriggerDefinition[] = [];

  /**
   * Register a trigger with the manager
   */
  register(trigger: TriggerDefinition): void {
    this.triggers.push(trigger);
    // Sort by priority (higher priority first)
    this.triggers.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Detect which trigger matches the input
   * Returns the first matching trigger based on priority
   * For positional triggers, only returns if trigger is at start
   * For inline triggers, returns if trigger exists anywhere
   */
  detectTrigger(input: string): TriggerDefinition | null {
    if (!input || input.trim() === '') {
      return null;
    }

    for (const trigger of this.triggers) {
      if (trigger.matches(input)) {
        return trigger;
      }
    }

    return null;
  }

  /**
   * Detect all triggers that match the input
   * Returns all matching triggers (both positional and inline)
   */
  detectAllTriggers(input: string): TriggerDefinition[] {
    if (!input || input.trim() === '') {
      return [];
    }

    const matchingTriggers: TriggerDefinition[] = [];

    for (const trigger of this.triggers) {
      if (trigger.matches(input)) {
        matchingTriggers.push(trigger);
      }
    }

    return matchingTriggers;
  }

  /**
   * Parse input to extract all inline trigger occurrences
   * Useful for extracting context triggers like @mentions
   */
  parseInlineTriggers(input: string, pattern: string): MultiTriggerParseResult {
    return parseMultiTriggerInput(input, pattern);
  }

  /**
   * Execute the appropriate trigger for the given input
   */
  async execute(input: string, context: TriggerContext): Promise<TriggerResult> {
    const trigger = this.detectTrigger(input);

    if (!trigger) {
      return {
        wasTriggered: false,
      };
    }

    try {
      return await trigger.execute(context);
    } catch (error) {
      return {
        wasTriggered: true,
        success: false,
        error: `Trigger execution failed: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Get all registered triggers
   */
  getTriggers(): TriggerDefinition[] {
    return [...this.triggers];
  }

  /**
   * Get a trigger by its pattern
   */
  getTriggerByPattern(pattern: string): TriggerDefinition | undefined {
    return this.triggers.find((t) => t.pattern === pattern);
  }
}


import type { TriggerDefinition, TriggerContext, TriggerResult } from './types';

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


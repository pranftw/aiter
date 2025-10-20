import type { TriggerDefinition, TriggerContext, TriggerResult } from '../core/types';
import { isTriggerPattern, parseInput } from '../core/utils';
import { CommandProcessor } from './processor';
import type { SlashCommand } from './types';

/**
 * Command trigger implementation for slash commands (/)
 */
export class CommandTrigger implements TriggerDefinition {
  pattern = '/';
  priority = 10; // High priority for commands

  private processor: CommandProcessor;
  private agent: string;

  constructor(agent: string) {
    this.agent = agent;
    this.processor = new CommandProcessor();
  }

  /**
   * Check if input matches the command pattern
   */
  matches(input: string): boolean {
    return isTriggerPattern(input, this.pattern);
  }

  /**
   * Parse the command input
   */
  parse(input: string) {
    return parseInput(input, this.pattern);
  }

  /**
   * Get command suggestions based on input
   */
  async getSuggestions(input: string): Promise<SlashCommand[]> {
    const parsed = this.parse(input);
    
    // If only '/' is typed, show all commands
    if (!parsed.command || parsed.command === '') {
      return await this.processor.getCommands(this.agent);
    }

    // Otherwise, search for matching commands
    return await this.processor.findCommands(parsed.command, this.agent);
  }

  /**
   * Execute the command
   */
  async execute(context: TriggerContext): Promise<TriggerResult> {
    const result = await this.processor.execute(
      context.rawInput,
      context.chatHook,
      this.agent
    );

    return {
      wasTriggered: result.wasCommand,
      success: result.success,
      error: result.error,
      data: {
        usage: result.usage,
        examples: result.examples,
        commandName: result.commandName,
      },
    };
  }
}


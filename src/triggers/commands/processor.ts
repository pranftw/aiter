import { CommandRegistry } from './registry';
import type { CommandContext, CommandExecuteResult } from './types';
import { isSlashCommand, parseCommandArgs } from './utils';
import type { ChatHook } from '@/lib/types';

/**
 * Processes command execution lifecycle
 */
export class CommandProcessor {
  private registry: CommandRegistry | null = null;
  private agent: string | null = null;
  private initPromise: Promise<void> | null = null;

  /**
   * Ensure the processor is initialized for the given agent
   */
  private async ensureInitialized(agent: string): Promise<void> {
    // If agent changed or not initialized, reinitialize
    if (this.agent !== agent || !this.registry) {
      this.agent = agent;
      this.registry = new CommandRegistry(agent);
      this.initPromise = this.registry.initialize();
    }

    // Wait for initialization to complete
    if (this.initPromise) {
      await this.initPromise;
    }
  }

  /**
   * Execute a command from user input
   */
  async execute(
    input: string,
    chatHook: ChatHook,
    agent: string
  ): Promise<CommandExecuteResult> {
    await this.ensureInitialized(agent);

    if (!this.registry) {
      return { wasCommand: false };
    }

    // Check if this is a slash command
    if (!isSlashCommand(input)) {
      return { wasCommand: false };
    }

    // Parse the command name and arguments
    const [commandName, ...argsParts] = input.slice(1).split(' ');
    const argsString = argsParts.join(' ');

    // Ensure commandName is valid
    if (!commandName) {
      return {
        wasCommand: true,
        success: false,
        error: 'Invalid command format',
      };
    }

    // Look up the command
    const command = this.registry.get(commandName);

    if (!command) {
      return {
        wasCommand: true,
        success: false,
        error: `Unknown command: /${commandName}`,
      };
    }

    // Parse arguments
    const parseResult = parseCommandArgs(command, argsString);

    if (!parseResult.success) {
      // Format error message with usage and examples
      let errorMsg = `Error: ${parseResult.error}`;
      
      if (command.usage) {
        errorMsg += `\n\nUsage: /${command.name} ${command.usage}`;
      }
      
      if (command.examples && command.examples.length > 0) {
        errorMsg += '\n\nExamples:';
        command.examples.forEach(example => {
          errorMsg += `\n  /${command.name} ${example}`;
        });
      }
      
      return {
        wasCommand: true,
        success: false,
        error: errorMsg,
      };
    }

    // Create command context
    const context: CommandContext = {
      chatHook,
      rawInput: input,
      triggerChar: '/',
      commandName,
      args: parseResult.args,
      argsString,
      agent,
      metadata: { agent },
    };

    // Execute the command
    try {
      await command.action(context);
      return { wasCommand: true, success: true };
    } catch (error) {
      return {
        wasCommand: true,
        success: false,
        error: `Command /${commandName} failed: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Get all available commands
   */
  async getCommands(agent: string) {
    await this.ensureInitialized(agent);
    return this.registry?.getAll() || [];
  }

  /**
   * Search for commands matching a query
   */
  async findCommands(query: string, agent: string) {
    await this.ensureInitialized(agent);
    return this.registry?.search(query) || [];
  }
}


import { TriggerRegistry } from '../core/registry';
import type { SlashCommand } from './types';
import * as builtinCommands from './builtin';

/**
 * Registry for slash commands
 * Manages both builtin and agent-specific commands
 */
export class CommandRegistry extends TriggerRegistry<SlashCommand> {
  private initialized = false;

  constructor() {
    super();
  }

  /**
   * Initialize the registry by loading commands
   */
  async initialize(agentCommands: Record<string, any> = {}): Promise<void> {
    if (this.initialized) {
      return;
    }

    // Load builtin commands
    this.loadBuiltinCommands();

    // Load agent-specific commands
    this.loadAgentCommands(agentCommands);

    this.initialized = true;
  }

  /**
   * Load builtin commands from the builtin directory
   */
  private loadBuiltinCommands(): void {
    // Import all commands from builtin index and register them
    Object.values(builtinCommands).forEach((command: any) => {
      if (command && typeof command === 'object' && command.name && command.action) {
        this.register(command as SlashCommand);
      }
    });
  }

  /**
   * Load agent-specific commands
   */
  private loadAgentCommands(agentCommands: Record<string, any>): void {
    Object.values(agentCommands).forEach((command: any) => {
      if (command && typeof command === 'object' && command.name && command.action) {
        this.register(command as SlashCommand);
      }
    });
  }

  /**
   * Check if the registry is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Override search to also search through command descriptions
   */
  override search(query: string): SlashCommand[] {
    if (!query) {
      return this.getAll();
    }

    const lowerQuery = query.toLowerCase();
    const matches = new Set<SlashCommand>();

    for (const command of this.items.values()) {
      // Check if name matches
      if (command.name.toLowerCase().includes(lowerQuery)) {
        matches.add(command);
        continue;
      }

      // Check if any alias matches
      if (command.aliases) {
        for (const alias of command.aliases) {
          if (alias.toLowerCase().includes(lowerQuery)) {
            matches.add(command);
            break;
          }
        }
        if (matches.has(command)) continue;
      }

      // Check if description matches
      if (command.description && command.description.toLowerCase().includes(lowerQuery)) {
        matches.add(command);
      }
    }

    return Array.from(matches);
  }
}


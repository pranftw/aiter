import { TriggerManager } from './core/manager';
import { CommandTrigger } from './commands';

/**
 * Configuration for creating a trigger manager
 */
export interface TriggerManagerConfig {
  /** Current agent type */
  agent: string;
  
  /** Workspace root directory (for future context trigger) */
  workspaceRoot?: string;
}

/**
 * Create and configure a trigger manager with all registered triggers
 */
export function createTriggerManager(config: TriggerManagerConfig): TriggerManager {
  const manager = new TriggerManager();

  // Register command trigger
  manager.register(new CommandTrigger(config.agent));

  // Future: Register other triggers here
  // manager.register(new ContextTrigger(config.workspaceRoot));
  // manager.register(new ShellTrigger());

  return manager;
}

// Re-export core types and classes
export * from './core/types';
export { TriggerManager } from './core/manager';
export { TriggerRegistry } from './core/registry';

// Re-export command types and classes
export * from './commands/types';
export { CommandTrigger } from './commands';


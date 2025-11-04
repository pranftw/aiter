import { getMCPClientsFromJSON, getToolsFromMCPClients, closeMCPClients, type MCPClient } from './mcp';
import type { MCPConfig } from '../lib/types';

export class MCPClientManager {
  private clients: MCPClient[] = [];
  public tools: Record<string, any> = {};
  private initialized = false;
  private isShuttingDown = false;

  async initialize(mcpJSON: MCPConfig): Promise<void> {
    if (this.initialized || this.isShuttingDown) {
      return;
    }

    try {
      this.clients = await getMCPClientsFromJSON(mcpJSON);
      this.tools = await getToolsFromMCPClients(this.clients);
      this.initialized = true;
      
      // Set up cleanup handlers
      this.setupCleanupHandlers();
    } catch (error) {
      console.error('Failed to initialize MCP clients:', error);
      await this.cleanup();
      throw error;
    }
  }

  private setupCleanupHandlers(): void {
    // Handle Ctrl+C (SIGINT)
    process.on('SIGINT', async () => {
      await this.cleanup();
      process.exit(0);
    });

    // Handle SIGTERM
    process.on('SIGTERM', async () => {
      await this.cleanup();
      process.exit(0);
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', async (error) => {
      console.error('Uncaught Exception:', error);
      await this.cleanup();
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', async (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
      await this.cleanup();
      process.exit(1);
    });

    // Note: No cleanup in 'exit' event handler because:
    // 1. Event loop is stopped, no async operations allowed
    // 2. MCP client.close() is async and won't work here
    // 3. Cleanup is handled by SIGINT/SIGTERM/uncaughtException handlers above
  }

  getTools(): Record<string, any> {
    if (!this.initialized) {
      throw new Error('MCP clients not initialized. Call initialize() first.');
    }
    return this.tools;
  }

  getClients(): MCPClient[] {
    if (!this.initialized) {
      throw new Error('MCP clients not initialized. Call initialize() first.');
    }
    return this.clients;
  }

  async cleanup(): Promise<void> {
    if (this.isShuttingDown) {
      return;
    }

    this.isShuttingDown = true;
    
    try {
      if (this.clients.length > 0) {
        await closeMCPClients(this.clients);
      }
      
      this.clients = [];
      this.tools = {};
      this.initialized = false;
    } catch (error) {
      console.error('Error during MCP cleanup:', error);
    }
  }


  isInitialized(): boolean {
    return this.initialized;
  }
}

// Export singleton instance
export const mcpManager = new MCPClientManager();

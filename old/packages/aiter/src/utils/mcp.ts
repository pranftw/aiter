import { experimental_createMCPClient as createMCPClient, type experimental_MCPClient as AISDKMCPClient } from 'ai';
import { Experimental_StdioMCPTransport as StdioMCPTransport } from 'ai/mcp-stdio';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import type { MCPConfig, MCPServerConfig } from '../lib/types';

export interface MCPClient {
  name: string;
  client: AISDKMCPClient;
}

interface MCPClientConfig {
  name: string;
  config: MCPServerConfig;
}

async function createMCPClients(configs: MCPClientConfig[], serverType: 'stdio' | 'sse' | 'http'	): Promise<MCPClient[]> {
  function getTransport(config: MCPServerConfig): any {
    switch (serverType) {
      case 'stdio':
        return new StdioMCPTransport({
          command: config.command,
          args: config.args || [],
          env: config.env || {}
        })
      case 'sse':
        return {
          type: 'sse',
          url: config.url,
          headers: config.headers || {}
        }
      case 'http':
        return new StreamableHTTPClientTransport(new URL(config.url), {
          requestInit: {
            headers: config.headers || {}
          }
        })
    }
  }
  return Promise.all(configs.map(async config => ({
    name: config.name,
    client: await createMCPClient({name: config.name, transport: getTransport(config.config)})
  })))
}

export async function getMCPClientsFromJSON(mcpJSON: MCPConfig): Promise<MCPClient[]> {
  const mcpServerConfigs = mcpJSON.mcpServers;
  const stdioConfigs: MCPClientConfig[] = []
  const sseConfigs: MCPClientConfig[] = []
  const httpConfigs: MCPClientConfig[] = []
  // getting configs for different transports
  for (const [mcpServerName, mcpServerConfig] of Object.entries(mcpServerConfigs)) {
    const config: MCPClientConfig = {name: mcpServerName, config: mcpServerConfig}
    switch (mcpServerConfig.type) {
      case 'stdio':
        stdioConfigs.push(config)
        break
      case 'sse':
        sseConfigs.push(config)
        break
      case 'http':
        httpConfigs.push(config)
        break
      default:
        throw new Error(`Unknown MCP server type: ${(mcpServerConfig as any).type}`)
    }
  }
  const clients = await Promise.all([
    createMCPClients(stdioConfigs, 'stdio'),
    createMCPClients(sseConfigs, 'sse'),
    createMCPClients(httpConfigs, 'http')
  ])
  return clients.flat()
}

export async function getToolsFromMCPClients(clients: MCPClient[]){
  const tools: Record<string, any> = {}
  const clientToolPromises = await Promise.all(
    clients.map(async ({name, client}) => ({
      clientName: name,
      tools: await client.tools()
    }))
  )
  for (const {clientName, tools: clientTools} of clientToolPromises) {
    for (const [toolName, tool] of Object.entries(clientTools)) {
      tools[`${clientName}__${toolName}`] = tool
    }
  }
  return tools
}

export async function closeMCPClients(clients: MCPClient[]){
  await Promise.all(
    clients.map(({client}) => client.close())
  )
}


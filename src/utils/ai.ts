import { experimental_createMCPClient as createMCPClient, type experimental_MCPClient as AISDKMCPClient } from 'ai';
import { Experimental_StdioMCPTransport as StdioMCPTransport } from 'ai/mcp-stdio';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import AIMessage from '@/components/chat/message/ai';
import fs from 'fs';
import z from 'zod';




export interface MCPClient {
  name: string;
  client: AISDKMCPClient;
}


async function createMCPClients(configs: any[], serverType: 'stdio' | 'sse' | 'http'	): Promise<MCPClient[]> {
  function getTransport(config: any): any {
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


export async function getMCPClientsFromJSON(mcpJSON: any): Promise<MCPClient[]> {
  const mcpServerConfigs = mcpJSON.mcpServers;
  const stdioConfigs = []
  const sseConfigs = []
  const httpConfigs = []
  // getting configs for different transports
  for (const [mcpServerName, mcpServerConfig] of Object.entries(mcpServerConfigs) as any[]) {
    const config = {name: mcpServerName, config: mcpServerConfig}
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
        throw new Error(`Unknown MCP server type: ${mcpServerConfig.type}`)
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


export function getPrompt(path: string){
  return fs.readFileSync(path, 'utf8');
}


export async function getStreamFunction(agent: string){
  const streamFunction = await import(`@/ai/agents/${agent}/stream-function`);
  return streamFunction.default;
}


export async function getDataSchema(agent: string){
  const schema = await import(`@/ai/agents/${agent}/schema`);
  if (!schema.DataSchema) {
    return z.object({}).default({});
  }
  return schema.DataSchema;
}


export async function getAIMessageComponent(agent: string){
  const component = await import(`@/ai/agents/${agent}/components/ai-message`);
  if (!component.default) {
    return AIMessage;
  }
  return component.default;
}


export function getMCPJSON(agent: string, name: string){
  const contents = fs.readFileSync(`src/ai/agents/${agent}/mcps/${name}.json`, 'utf8');
  const mcpJSON = JSON.parse(contents);
  return mcpJSON;
}


export async function getAgentCommands(agent: string){
  try {
    const commands = await import(`@/ai/agents/${agent}/commands`);
    return commands;
  } catch (error) {
    // Agent doesn't have custom commands - return empty object
    return {};
  }
}
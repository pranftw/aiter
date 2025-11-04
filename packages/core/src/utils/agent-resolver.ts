import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import type { Agent, MCPConfig } from '../lib/types';

export interface AgentResolverConfig {
  basePath?: string;
}

export function createAgentResolver(config: AgentResolverConfig = {}) {
  const { basePath = path.join(process.cwd(), 'src/ai/agents') } = config;

  async function getAgent(agentName: string): Promise<Agent> {
    const agentPath = path.join(basePath, agentName);
    
  const streamFunction = await import(`${agentPath}/stream-function`);
  
  let tools = {};
    try {
      tools = await import(`${agentPath}/tools`);
    } catch {}
    
    let commands = {};
    try {
      commands = await import(`${agentPath}/commands`);
    } catch {}
    
    let dataSchema = z.object({}).default({});
    try {
      const schema = await import(`${agentPath}/schema`);
      dataSchema = schema.DataSchema || dataSchema;
    } catch {}
    
    return {
      name: agentName,
      streamFunction: streamFunction.default,
      dataSchema,
      tools,
      commands,
      mcpConfig: resolveMCPConfig(agentPath),
      systemPrompt: resolveSystemPrompt(agentPath)
    };
  }

  function resolveMCPConfig(agentPath: string, configName: string = 'main'): MCPConfig {
    try {
      const contents = fs.readFileSync(
        path.join(agentPath, 'mcps', `${configName}.json`),
        'utf8'
      );
      return JSON.parse(contents);
    } catch {
      return { mcpServers: {} };
    }
  }

  function resolveSystemPrompt(agentPath: string, promptName: string = 'main'): string {
    try {
      return fs.readFileSync(
        path.join(agentPath, 'system-prompts', `${promptName}.md`),
        'utf8'
      );
    } catch {
      return '';
    }
  }

  function getAgents(): string[] {
    const ignored = ['template', '.DS_Store'];
    try {
      let agents = fs.readdirSync(basePath);
      return agents.filter(agent => {
        if (ignored.includes(agent)) return false;
        return fs.statSync(path.join(basePath, agent)).isDirectory();
      });
    } catch {
      return [];
    }
  }

  return {
    getAgent,
    getAgents
  };
}


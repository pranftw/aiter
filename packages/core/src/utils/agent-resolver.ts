import { z } from 'zod';
import fs from 'fs';
import path from 'path';

export interface AgentConfig {
  name: string;
  components: any;
  streamFunction: any;
  dataSchema: z.ZodSchema;
  tools: Record<string, any>;
  commands: Record<string, any>;
  mcpConfig: any;
  systemPrompt: string;
}

export interface AgentResolverConfig {
  basePath: string;
}

export function createAgentResolver(config: AgentResolverConfig) {
  const { basePath } = config;

  async function getAgent(agentName: string): Promise<AgentConfig> {
    const agentPath = path.join(basePath, agentName);
    
    const components = await import(`${agentPath}/components`);
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
      components,
      streamFunction: streamFunction.default,
      dataSchema,
      tools,
      commands,
      mcpConfig: resolveMCPConfig(agentPath),
      systemPrompt: resolveSystemPrompt(agentPath)
    };
  }

  function resolveMCPConfig(agentPath: string, configName: string = 'main'): any {
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


import type { useChat } from '@ai-sdk/react';
import type { UIMessage } from 'ai';
import type React from 'react';
import type { z } from 'zod';
import type { StreamFunctionType } from '../ai/custom-chat-transport';
import type { SlashCommand } from '../triggers/commands/types';


export type ChatHook = ReturnType<typeof useChat>;
export type AIMessageComponent = (props: { message: UIMessage }) => React.ReactNode;

// MCP Server Configuration for stdio transport
export interface MCPServerStdioConfig {
  type: 'stdio';
  command: string;
  args?: string[];
  env?: Record<string, string>;
}

// MCP Server Configuration for SSE transport
export interface MCPServerSSEConfig {
  type: 'sse';
  url: string;
  headers?: Record<string, string>;
}

// MCP Server Configuration for HTTP transport
export interface MCPServerHTTPConfig {
  type: 'http';
  url: string;
  headers?: Record<string, string>;
}

// Union type for all MCP server configurations
export type MCPServerConfig = MCPServerStdioConfig | MCPServerSSEConfig | MCPServerHTTPConfig;

// MCP Configuration containing all MCP servers
export interface MCPConfig {
  mcpServers: Record<string, MCPServerConfig>;
}

// Agent component module structure
export interface AgentComponents {
  default: AIMessageComponent;
  [key: string]: any;
}

// Agent configuration containing all agent-specific settings and modules
export interface AgentConfig {
  name: string;
  components: AgentComponents;
  streamFunction: StreamFunctionType;
  dataSchema: z.ZodSchema;
  tools: Record<string, any>;
  commands: Record<string, SlashCommand>;
  mcpConfig: MCPConfig;
  systemPrompt: string;
}
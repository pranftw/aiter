# @aiter/core

Core business logic library for aiter - provides UI-agnostic infrastructure for building AI terminal applications.

## Features

- **Trigger System**: Command processing, registry, and execution
- **MCP Integration**: Model Context Protocol client management
- **Chat Management**: Session CRUD operations and utilities
- **Agent Resolution**: Dynamic agent loading system
- **AI Transport**: Custom chat transport layer for AI SDK
- **Type Definitions**: Shared types and schemas

## Installation

```bash
bun add @aiter/core
```

For UI components, also install:
```bash
bun add @aiter/ui
```

## Usage

```typescript
import { 
  initializeMCP, 
  createAgentResolver,
  initializeChat,
  ChatSchema,
  createTriggerManager
} from '@aiter/core';

// Initialize MCP servers
await initializeMCP(mcpConfig);

// Load agent
const agentResolver = createAgentResolver({ basePath: './agents' });
const agent = await agentResolver.getAgent('my-agent');

// Initialize chat
const chat = await initializeChat(chatId, agentName, dataSchema);
```

## API

### Chat Management
- `initializeChat` - Create or load a chat session
- `updateChatMessages` - Update messages in a chat
- `getChat` - Retrieve a chat by ID
- `ChatSchema` - Zod schema for chat validation

### MCP Integration
- `initializeMCP` - Initialize MCP servers
- `cleanup` - Clean up MCP connections
- `mcpManager` - Global MCP manager instance

### Agent System
- `createAgentResolver` - Create an agent resolver
- `AgentConfig` - Agent configuration type

### Trigger System
- `createTriggerManager` - Create a trigger manager with registered triggers
- `CommandTrigger` - Command trigger implementation
- `TriggerDefinition` - Base trigger interface

### Utilities
- `colors` - Color palette for terminal UIs
- `CustomChatTransport` - AI SDK transport implementation

## Package Structure

This package is UI-agnostic. For React/OpenTUI components, see `@aiter/ui`.

## API Reference

See the main aiter repository for full documentation.


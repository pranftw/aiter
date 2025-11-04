# @aiter/core

Core runtime library for aiter - provides the infrastructure for building AI terminal user interfaces with Model Context Protocol (MCP) integration.

Part of the [aiter](https://github.com/pranftw/aiter) project.

## What is aiter?

A powerful terminal-based AI chat interface built with OpenTUI and React, featuring a modular agent system. Built on the **[Vercel AI SDK](https://github.com/vercel/ai)** and **[OpenTUI](https://github.com/sst/opentui)**.

**For developers who want to build with AI, not just use it.**

## Installation

**Note:** This is a core library. Most users should use `@aiter/cli` to create applications:

```bash
# Create a new aiter application (recommended)
bunx @aiter/cli create app my-chat-app
```

If you're building a custom application:

```bash
bun add @aiter/core
```

## What's Included

- **UI Components**: React components for terminal interfaces (ChatContainer, Messages, ChatBox, etc.)
- **Trigger System**: Extensible command processing and registry
- **MCP Integration**: Model Context Protocol client management and tool loading
- **Chat Management**: Session creation, persistence, and resumption
- **Agent Resolution**: Dynamic agent loading with file-system based organization
- **Component Context**: System for customizing and overriding UI components

## Quick Example

```typescript
import { 
  ChatContainerWrapper, 
  initializeMCP, 
  createAgentResolver 
} from '@aiter/core';

// Initialize agent system
const agentResolver = createAgentResolver();
const agent = await agentResolver.getAgent('my-agent');

// Initialize MCP tools
await initializeMCP(agent.mcpConfig);

// Render chat interface
<ChatContainerWrapper
  chat={chat}
  prompt={prompt}
  agent={agent}
  customComponents={customComponents}
/>
```

## Documentation

See the [main aiter repository](https://github.com/pranftw/aiter) for full documentation and examples.

## License

See LICENSE file.


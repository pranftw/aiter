# @aiter/ui

React/OpenTUI components for building AI-powered terminal interfaces.

## Installation

```bash
bun add @aiter/ui @aiter/core
```

## Usage

```typescript
import { ChatContainerWrapper } from '@aiter/ui';
import { ChatSchema, type StreamFunctionType } from '@aiter/core';

function MyApp() {
  return (
    <ChatContainerWrapper
      chat={chat}
      prompt={prompt}
      streamFunction={streamFunction}
      agentCommands={commands}
    />
  );
}
```

## Components

### Chat Components
- `ChatContainerWrapper` - Main wrapper component with customization support
- `ChatContainer` - Chat interface container
- `ChatMessages` - Message list renderer
- `ChatBox` - Input box component
- `AIMessage` - AI message renderer
- `UserMessage` - User message renderer

### UI Components
- `StatusIndicator` - Status indicator with color coding
- `ErrorOverlay` - Error display overlay
- `TriggerWindow` - Trigger UI window
- `CommandSuggestions` - Command suggestions list

## Component Context

The UI package provides a component context system for customization:

```typescript
import * as customComponents from './my-components';

<ChatContainerWrapper
  customComponents={customComponents}
  // ...
/>
```

## Source Files

This package includes source files in the `src/` directory for customization purposes. When building custom components, you can reference the source implementations.

## Dependencies

Peer dependencies:
- `@aiter/core` - Core business logic
- `react` - React library
- `@opentui/core` and `@opentui/react` - Terminal UI framework
- `@ai-sdk/react` - AI SDK React hooks
- `ai` - Vercel AI SDK
- `zod` - Schema validation



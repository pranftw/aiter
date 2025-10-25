# aiter

A powerful terminal-based AI chat interface with a modular agent system and Model Context Protocol (MCP) integration.

## Monorepo Structure

This repository uses Bun workspaces to manage multiple packages:

- **`packages/core`** - Core runtime library (`@aiter/core`)
- **`packages/create-aiter-app`** - CLI tool for creating new aiter projects
- **`dev/`** - Development workspace (gitignored, created from template)

## Development Setup

This monorepo uses **direct source imports** - no build step needed during development!

### First Time Setup

```bash
# Install dependencies
bun install

# Create dev workspace from template
bun setup-dev

# Create dev/.env with your configuration
# Example: MAIN_AGENT_MODEL=anthropic/claude-3.5-sonnet
# Example: CHATS_PATH=./chats
```

### Development Workflow

```bash
# Run the dev workspace
bun dev -a example

# Make changes to packages/core/src/*
# Changes are instantly reflected - no rebuild needed! ✨

# Type check all packages
bun run typecheck

# Build packages (only needed for publishing)
bun run build

# Clean all builds
bun run clean
```

## Packages

### @aiter/core

The core runtime library that provides:
- UI components for building terminal interfaces
- Trigger system for commands
- MCP client management
- Chat session management
- Agent resolution system

### create-aiter-app

CLI tool that scaffolds new aiter applications with:
- Pre-configured project structure
- Example agent
- Template for creating new agents
- Component override system

## Creating a Standalone App

To create a new aiter app outside the monorepo:

```bash
# From outside the aiter directory
cd ~/projects
bun run /path/to/aiter/packages/create-aiter-app/src/index.ts -n my-chat-app

# Or after publishing to npm
npx create-aiter-app -n my-chat-app

# Then run it
cd my-chat-app
bun install
bun run src/index.tsx --agent example
```

## License

See LICENSE file in each package.


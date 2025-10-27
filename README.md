# aiter

A powerful terminal-based AI chat interface with a modular agent system and Model Context Protocol (MCP) integration.

## Monorepo Structure

This repository uses Bun workspaces to manage multiple packages:

- **`packages/aiter`** - Core runtime library (`@aiter/aiter`)
- **`packages/create`** - CLI tool for creating new aiter projects and agents
- **`packages/create/template`** - Template used for creating new projects (also serves as development workspace)

## Development Setup

This monorepo uses **direct source imports** - no build step needed during development!

### First Time Setup

```bash
# Install dependencies
bun install

# Create packages/create/template/.env with your configuration
# Example: MAIN_AGENT_MODEL=anthropic/claude-3.5-sonnet
# Example: CHATS_PATH=./chats
```

### Development Workflow

```bash
# Run the template workspace (development environment)
bun dev -a example

# Make changes to packages/aiter/src/* or packages/create/template/src/*
# Changes are instantly reflected - no rebuild needed! ✨

# Type check all packages
bun run typecheck

# Build packages (only needed for publishing)
bun run build

# Clean all builds
bun run clean
```

## Packages

### @aiter/aiter

The core runtime library that provides:
- UI components for building terminal interfaces
- Trigger system for commands
- MCP client management
- Chat session management
- Agent resolution system

### create

CLI tool that scaffolds new aiter applications and agents with:
- Pre-configured project structure
- Example agent template
- Modular capability system (commands, tools, mcps, system-prompts, components)
- Component override system

## Creating a Standalone App

To create a new aiter app outside the monorepo:

```bash
# Create a new application (in current directory)
npx @aiter/create --type app --name my-chat-app

# Or specify a path
npx @aiter/create --type app --name my-chat-app --path ~/projects

# Or from monorepo
bun run create --type app --name my-chat-app

# Run it
cd ~/projects/my-chat-app
bun install
bun run src/index.tsx --agent example
```

## Creating Agents

```bash
# Create an agent in current directory (auto-detects existing project)
cd my-chat-app
npx @aiter/create --type agent --name my-agent --capabilities commands,tools

# Interactive mode (prompts for capabilities)
npx @aiter/create --type agent --name my-agent

# Non-interactive with all capabilities
npx @aiter/create --type agent --name my-agent --capabilities all --interactive false
```

## License

See LICENSE file in each package.


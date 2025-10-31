# aiter

A powerful terminal-based AI chat interface with a modular agent system and Model Context Protocol (MCP) integration.

## Monorepo Structure

This repository uses Bun workspaces to manage multiple packages:

- **`packages/core`** - Core runtime library (`@aiter/core`)
- **`packages/cli`** - CLI tool for creating new aiter projects and agents
- **`packages/cli/template`** - Template used for creating new projects (also serves as development workspace)

## Development Setup

This monorepo uses **direct source imports** - no build step needed during development!

### First Time Setup

```bash
# Install dependencies
bun install

# Create packages/cli/template/.env with your configuration
# Example: MAIN_AGENT_MODEL=anthropic/claude-3.5-sonnet
# Example: CHATS_PATH=./chats
```

### Development Workflow

```bash
# Run the template workspace (development environment)
bun dev -a example

# Make changes to packages/core/src/* or packages/cli/template/src/*
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

### @aiter/cli

CLI tool that scaffolds new aiter applications and agents with:
- Pre-configured project structure
- Example agent template
- Modular customization system (commands, tools, mcps, system-prompts, components)
- Component override system

## Creating a Standalone App

To create a new aiter app outside the monorepo:

```bash
# Create a new application
bunx @aiter/cli create app my-chat-app

# Or specify a path
bunx @aiter/cli create app my-chat-app --path ~/projects

# Or from monorepo
bun run create create app my-chat-app

# Run it
cd my-chat-app
bun install
bun run src/index.tsx --agent example
```

## Adding Agents

```bash
# Add an agent to an existing project (auto-detects existing project)
cd my-chat-app
bunx @aiter/cli add agent my-agent --customize commands,tools

# Interactive mode (prompts for customizations)
bunx @aiter/cli add agent my-agent

# Non-interactive with all customizations
bunx @aiter/cli add agent my-agent --customize all --interactive false
```

## License

See LICENSE file in each package.


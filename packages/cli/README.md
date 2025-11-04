# @aiter/cli

CLI tool for scaffolding aiter applications and agents.

Part of the [aiter](https://github.com/pranftw/aiter) project.

## What is aiter?

A powerful terminal-based AI chat interface built with OpenTUI and React, featuring a modular agent system with Model Context Protocol (MCP) integration.

**For developers who want to build with AI, not just use it.** Perfect for experimentation, MCP testing, custom workflows, and understanding how AI interactions actually work.

## Quick Start

### Create Application

```bash
bunx @aiter/cli create app my-chat-app
cd my-chat-app
bun install
bun run src/index.tsx
```

This creates a complete aiter application with:
- Pre-configured project structure
- Example agent with sample customizations
- Component override system
- Chat session management
- MCP integration support

### Add Agent

```bash
# Interactive mode (prompts for customizations)
bunx @aiter/cli add agent my-agent
# Non-interactive with specific customizations
bunx @aiter/cli add agent my-agent --customize commands,tools,mcps
# Add all customizations
bunx @aiter/cli add agent my-agent --customize all --interactive false
```

## Commands

### create app

Create a new aiter application.

```bash
bunx @aiter/cli create app <name> [options]
```

**Options:**
- `--path`, `-p` - Target directory path (default: current directory)

**Example:**
```bash
bunx @aiter/cli create app my-chat-app --path ~/projects
```

### add agent

Add an agent to an existing aiter project.

```bash
bunx @aiter/cli add agent <name> [options]
```

**Options:**
- `--path`, `-p` - Project directory path (default: current directory)
- `--customize`, `-c` - Customizations to include: `commands`, `tools`, `mcps`, `system-prompts`, `all`
- `--interactive`, `-i` - Interactive mode (default: true)

**Example:**
```bash
cd my-chat-app
bunx @aiter/cli add agent coding-assistant --customize commands,tools,mcps
```

## Agent Customizations

Choose which features to include when creating agents:

- **commands** - Custom slash commands for the chat interface
- **tools** - AI tools/functions the agent can use
- **mcps** - Model Context Protocol server configurations
- **system-prompts** - Custom system prompts to define agent behavior
- **all** - Include all customizations

## Documentation

See the [main aiter repository](https://github.com/pranftw/aiter) for:
- Full documentation
- Customization guides
- Architecture details
- Examples and tutorials

## License

See LICENSE file.

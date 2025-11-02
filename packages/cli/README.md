# @aiter/cli

CLI tool for creating aiter applications and agents.

## Usage

### Create Application

Create a full aiter application with example agent:

```bash
# Create full aiter application
bunx @aiter/cli create app my-app

# With specific path
bunx @aiter/cli create app my-app --path ./projects

# From monorepo
bun run create create app my-app
```

### Add Agent

Add agents with modular customizations. Automatically detects if you're in an existing aiter project:

```bash
# Add agent (auto-detects if in existing project)
bunx @aiter/cli add agent my-agent

# With specific customizations
bunx @aiter/cli add agent my-agent --customize commands,tools

# With all customizations
bunx @aiter/cli add agent my-agent --customize all

# Non-interactive mode
bunx @aiter/cli add agent my-agent --customize all --interactive false

# In a specific path
bunx @aiter/cli add agent my-agent --path ./my-project
```

## Commands

### create

Create a new aiter resource.

**Usage:** `bunx @aiter/cli create <type> <name> [options]`

**Positional Arguments:**
- `type` - Resource type to create (required)
  - `app` - Full aiter application
- `name` - Resource name (required)

**Options:**
- `--path`, `-p` - Target directory path (default: current directory)

### add

Add a resource to an existing aiter project.

**Usage:** `bunx @aiter/cli add <type> <name> [options]`

**Positional Arguments:**
- `type` - Resource type to add (required)
  - `agent` - AI agent
- `name` - Resource name (required)

**Options:**
- `--path`, `-p` - Project directory path (default: current directory)
- `--customize`, `-c` - Customizations to include: commands, tools, mcps, system-prompts, all
- `--interactive`, `-i` - Interactive mode (default: true)

## Customizations

When adding agents, you can choose which customizations to include:

- **commands** - Slash commands for the chat interface
- **tools** - AI tools/functions for the agent
- **mcps** - Model Context Protocol server configurations
- **system-prompts** - Custom system prompts for the agent
- **all** - Include all customizations

## What Gets Created

### App Creation

Creates a complete aiter application with:

- Pre-configured project structure
- Example agent with sample customizations
- Template agent for creating new agents
- Component override system
- Chat session management
- MCP integration support
- Package.json with dependencies

### Agent Addition

**In existing project:**
- Creates new agent directory in `src/ai/agents/`
- Copies selected customizations from template
- Core files (schema.ts, stream-function.ts)

**Not in existing project:**
- Shows error message and suggests using `create app` command

## Development

From the cli directory:

```bash
bun install
bun run build

# Test locally
bun run src/index.ts create app test-app --path ./tmp
bun run src/index.ts add agent test-agent --path ./tmp/test-app
```

## Publishing

```bash
# Build and publish with version bump
bun run build --prod --bump patch
```

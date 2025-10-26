# @aiter/create

CLI tool for creating aiter applications and agents.

## Usage

### Create Application

Create a full aiter application with example agent:

```bash
# Create full aiter application
create --type app --name my-app --path ./projects

# From monorepo
bun run create --type app --name my-app --path ./dev-apps
```

### Create Agent

Create agents with modular capabilities. Automatically detects if you're in an existing aiter project:

```bash
# Create agent (auto-detects if in existing project)
create --type agent --name my-agent

# With specific capabilities
create --type agent --name my-agent --capabilities commands,tools

# With all capabilities
create --type agent --name my-agent --capabilities all

# Non-interactive mode
create --type agent --name my-agent --capabilities all --interactive false

# In a specific path
create --type agent --name my-agent --path ./my-project
```

## Options

### Common Options

- `--type`, `-t` - Creation type: 'app' or 'agent' (required)
- `--name`, `-n` - Project/agent name (required)
- `--help`, `-h` - Show help

### Type-Specific Options

#### For --type app

- `--path`, `-p` - Target directory path (default: current directory)

#### For --type agent

- `--path`, `-p` - Target directory path (default: current directory)
- `--capabilities`, `-c` - Capabilities to include: commands, tools, mcps, system-prompts, components, all
- `--interactive`, `-i` - Interactive mode (default: true)

## Capabilities

When creating agents, you can choose which capabilities to include:

- **commands** - Slash commands for the chat interface
- **tools** - AI tools/functions for the agent
- **mcps** - Model Context Protocol server configurations
- **system-prompts** - Custom system prompts for the agent
- **components** - Custom React components for the UI
- **all** - Include all capabilities

## What Gets Created

### App Creation (--type app)

Creates a complete aiter application with:

- Pre-configured project structure
- Example agent with sample capabilities
- Template agent for creating new agents
- Component override system
- Chat session management
- MCP integration support
- Package.json with dependencies

### Agent Creation (--type agent)

**In existing project:**
- Creates new agent directory in `src/ai/agents/`
- Copies selected capabilities from template
- Core files (schema.ts, stream-function.ts)

**Outside existing project:**
- Creates new project with single agent
- Includes only requested capabilities
- Minimal setup for quick start

## Development

From the create directory:

```bash
bun install
bun run build

# Test locally
bun run src/index.ts --type app --name test-app --path ./tmp
```

## Publishing

```bash
# Build and publish with version bump
bun run build --prod --bump patch
```

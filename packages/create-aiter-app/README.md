# create-aiter-app

CLI tool for creating new aiter applications.

## Usage

```bash
# From the monorepo root
bun run create-aiter-app --path ~/projects --project my-chat-app

# Or directly with npx/bunx
npx create-aiter-app --path ~/projects --project my-chat-app
```

## Options

- `--path` - Target directory path (required)
- `--project` - Project name (required)

## What Gets Created

The CLI scaffolds a complete aiter application with:

- Pre-configured project structure
- Example agent with tools and commands
- Template agent for creating new agents
- Component override system
- Chat session management
- MCP integration support

## Development

From the create-aiter-app directory:

```bash
bun install
bun run build
```


# Machship MCP Server

A Model Context Protocol server that integrates AI assistants with the [Machship](https://machship.com) freight management platform. Built on a production-ready TypeScript foundation, it provides comprehensive access to Machship for consignment management, quoting, labelling, manifesting, and more — through any MCP-compatible AI client.

**Built by [Devkind](https://devkind.com.au)** — cutting-edge software development serving businesses globally.

[![NPM Version](https://img.shields.io/npm/v/machship-mcp)](https://www.npmjs.com/package/machship-mcp)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![Built by Devkind](https://img.shields.io/badge/Built%20by-Devkind-blue)](https://devkind.com.au)

## Features

- **Full Machship API Coverage**: ~65 tools across 21 modules — consignments, quotes, labels, manifests, carriers, locations, and more
- **Dual Transport Support**: STDIO and HTTP transports for AI assistant and web integration
- **Type Safety**: Full TypeScript implementation with Zod schema validation
- **npx Ready**: Zero-install usage via `npx machship-mcp`
- **Docker Support**: Production Docker image on Docker Hub
- **Any MCP Client**: Works with Claude Desktop, Cursor, VS Code, Windsurf, and more

## Available Tools

| Module | Tools |
|---|---|
| Authenticate | ping |
| Attachments | get, POD report, batch download, upload |
| CarrierInvoices | list, entries, reprice, auto-reconcile |
| CommercialInvoices | upload |
| Companies | list, carriers/accounts/services |
| CompanyItems | get, list, by-sku, complex variants, create, delete |
| CompanyLocations | get, list, create, edit, permanent pickups |
| Consignments | get, batch, by-reference, create, edit, delete, search, statuses |
| Consolidation | group, perform, group+perform |
| CustomSchemas | get all, get by id, create, update, delete |
| FinancialInvoice | list posted, get by document number |
| Labels | consignment PDF, item PDF, manifest PDF, batch zip, print, dangerous goods |
| Locations | search, exact match, with options |
| Manifests | list, group, manifest/book, rebook pickup |
| Notes | get consignment notes |
| OrganisationLinks | get links, add, remove, public key management |
| PendingConsignments | create, get, batch, by-reference, recent, delete |
| Quotes | create, create with complex items, list, get |
| Routes | get routes, batch routes, complex items routes |

**Total: ~65 tools**

## Quick Start (No Install Required)

> No cloning, no global installs — just Node.js 18+ and a Machship API token.

**Step 1 — Get your Machship API token**

1. Log into your Machship account
2. Go to **Settings → API**
3. Generate a Bearer token — this is your `MACHSHIP_API_TOKEN`

**Step 2 — Add to your MCP client** (pick one below)

**Step 3 — Restart your client and start chatting**

> To verify it works, ask: _"Ping the Machship API"_ — you should get a successful response.

---

## Client Setup

### Claude Desktop

Edit `~/.claude/claude_desktop_config.json` (create it if it doesn't exist):

```json
{
  "mcpServers": {
    "machship": {
      "command": "npx",
      "args": ["-y", "machship-mcp"],
      "env": {
        "MACHSHIP_API_TOKEN": "your-token-here"
      }
    }
  }
}
```

Restart Claude Desktop — the Machship tools will appear automatically.

### Claude Code (CLI)

Run once to add to your project MCP config:

```bash
claude mcp add machship -- npx -y machship-mcp
```

Then set the token in your environment or `.env`:

```bash
export MACHSHIP_API_TOKEN=your-token-here
```

Or add it directly to `.mcp.json` after running the command above:

```json
{
  "mcpServers": {
    "machship": {
      "command": "npx",
      "args": ["-y", "machship-mcp"],
      "env": {
        "MACHSHIP_API_TOKEN": "your-token-here"
      }
    }
  }
}
```

<details>
<summary>Cursor</summary>

#### One-click install:

[<img src="https://cursor.com/deeplink/mcp-install-dark.svg" alt="Install in Cursor">](https://cursor.com/en/install-mcp?name=Machship%20MCP&config=eyJjb21tYW5kIjoibnB4IiwiYXJncyI6WyIteSIsIm1hY2hzaGlwLW1jcCJdLCJlbnYiOnsiTUFDSFNISVBfQVBJX1RPS0VOIjoieW91ci10b2tlbi1oZXJlIn19)

#### Manual setup:

Go to `Cursor Settings` → `MCP` → `Add new MCP Server`:
- **Name:** Machship MCP
- **Type:** command
- **Command:** `npx -y machship-mcp`
- **Environment variable:** `MACHSHIP_API_TOKEN` = `your-token-here`

</details>

<details>
<summary>VS Code</summary>

Install via the VS Code CLI (one command):

```bash
code --add-mcp '{"name":"machship","command":"npx","args":["-y","machship-mcp"],"env":{"MACHSHIP_API_TOKEN":"your-token-here"}}'
```

Or follow the MCP [setup guide](https://code.visualstudio.com/docs/copilot/chat/mcp-servers#_add-an-mcp-server) and use this config:

```json
{
  "mcpServers": {
    "machship": {
      "command": "npx",
      "args": ["-y", "machship-mcp"],
      "env": {
        "MACHSHIP_API_TOKEN": "your-token-here"
      }
    }
  }
}
```

</details>

<details>
<summary>Windsurf</summary>

Follow the Windsurf MCP [documentation](https://docs.windsurf.com/windsurf/cascade/mcp) and add to your MCP configuration file:

```json
{
  "mcpServers": {
    "machship": {
      "command": "npx",
      "args": ["-y", "machship-mcp"],
      "env": {
        "MACHSHIP_API_TOKEN": "your-token-here"
      }
    }
  }
}
```

</details>

<details>
<summary>Goose</summary>

Go to `Advanced settings` → `Extensions` → `Add custom extension`:
- **Name:** Machship MCP
- **Type:** STDIO
- **Command:** `npx -y machship-mcp`
- **Environment variable:** `MACHSHIP_API_TOKEN` = `your-token-here`

</details>

<details>
<summary>LM Studio</summary>

Go to `Program` in the right sidebar → `Install` → `Edit mcp.json` and add:

```json
{
  "mcpServers": {
    "machship": {
      "command": "npx",
      "args": ["-y", "machship-mcp"],
      "env": {
        "MACHSHIP_API_TOKEN": "your-token-here"
      }
    }
  }
}
```

</details>

<details>
<summary>Warp</summary>

Go to `Settings` → `AI` → `Manage MCP Servers` → `+ Add`, or use the slash command `/add-mcp` in the Warp prompt:

```json
{
  "mcpServers": {
    "machship": {
      "command": "npx",
      "args": ["-y", "machship-mcp"],
      "env": {
        "MACHSHIP_API_TOKEN": "your-token-here"
      }
    }
  }
}
```

</details>

### Run directly (test / CLI use)

```bash
# STDIO mode — pipe JSON-RPC directly
MACHSHIP_API_TOKEN=your-token npx -y machship-mcp

# HTTP mode — exposes a local MCP endpoint
MACHSHIP_API_TOKEN=your-token TRANSPORT=http npx -y machship-mcp
# MCP endpoint: http://localhost:3000/mcp
# Health check:  http://localhost:3000/health
```

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `MACHSHIP_API_TOKEN` | Yes | — | Machship Bearer token |
| `MACHSHIP_API_URL` | No | `https://live.machship.com` | Override API base URL |
| `TRANSPORT` | No | `stdio` | `stdio` or `http` |
| `PORT` | No | `3000` | HTTP port (when `TRANSPORT=http`) |

## Example Interactions

Once connected, ask your AI assistant:

```
"Search for freight routes from Melbourne 3000 to Sydney 2000 for a 10kg parcel"
"Create a consignment for company 123 shipping to Brisbane"
"Get all unmanifested consignments for company 456"
"What carriers and services are available for company 789?"
"Get the label PDF for consignment 12345"
"Show me completed consignments from last week"
"Create a quote with complex items for express delivery"
```

## Transport Modes

| Mode | When to use |
|------|-------------|
| `stdio` (default) | AI desktop clients (Claude Desktop, Cursor, VS Code, etc.) — JSON-RPC over stdin/stdout |
| `http` | Web integrations, remote servers, or anything that needs an HTTP MCP endpoint |

Set the mode via the `TRANSPORT` environment variable (see [Environment Variables](#environment-variables) below).

## Docker

Pull and run from Docker Hub — no Node.js required:

```bash
docker run -e MACHSHIP_API_TOKEN=your-token \
           -e TRANSPORT=http \
           -p 3000:3000 \
           devkind/machship-mcp:latest
```

For stdio mode in MCP clients:

```json
{
  "mcpServers": {
    "machship": {
      "command": "docker",
      "args": ["run", "--rm", "-i",
               "-e", "MACHSHIP_API_TOKEN=your-token-here",
               "devkind/machship-mcp:latest"]
    }
  }
}
```

## Development

### Quick Start

```bash
# Clone and install
git clone https://github.com/devkindhq/machship-mcp.git
cd machship-mcp
yarn install

# Build
yarn build

# Run in STDIO mode
MACHSHIP_API_TOKEN=your-token yarn start

# Run in HTTP mode
MACHSHIP_API_TOKEN=your-token TRANSPORT=http yarn start

# Development with watch mode
MACHSHIP_API_TOKEN=your-token yarn dev
```

### Scripts

```bash
yarn build                  # Compile TypeScript to dist/
yarn dev                    # Watch mode with tsx
yarn start                  # Run compiled server
yarn clean                  # Remove dist/

# Docker
yarn docker:build           # Build image as devkind/machship-mcp:latest
yarn docker:build:version   # Tag with package version + latest
yarn docker:run             # Run locally in HTTP mode on port 3000
yarn docker:push            # Push latest to Docker Hub
yarn docker:push:version    # Push version tag + latest to Docker Hub
yarn docker:release         # Full pipeline: build + tag + push
```

### Publishing to npm

```bash
# Login to npm
npm login

# Publish
npm publish
```

### Publishing to Docker Hub

```bash
# Login to Docker Hub
docker login

# Build, tag, and push
yarn docker:release
```

## License

[ISC License](https://opensource.org/licenses/ISC)

## Resources

- [MCP Specification](https://modelcontextprotocol.io/specification/2025-06-18)
- [MCP SDK](https://github.com/modelcontextprotocol/sdk)
- [Machship API Documentation](https://machship.com)
- [Devkind](https://devkind.com.au) — the team behind this server

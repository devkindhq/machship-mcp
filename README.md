# Machship MCP Server

MCP (Model Context Protocol) server for the [Machship](https://machship.com) freight management platform.
Compatible with Claude, OpenAI, Gemini, Cursor, and any MCP-compliant LLM client.

## Modules Covered

| Module | Tools |
|--------|-------|
| Authenticate | ping |
| Attachments | get, pod report, batch download, upload |
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

## Setup

### 1. Build

```bash
npm install
npm run build
```

### 2. Get your Machship API token

Log into Machship → Settings → API → generate a Bearer token.

### 3. Configure your MCP client

#### Claude Desktop (`~/.claude/claude_desktop_config.json`)

```json
{
  "mcpServers": {
    "machship": {
      "command": "node",
      "args": ["/path/to/machship-mcp/dist/index.js"],
      "env": {
        "MACHSHIP_API_TOKEN": "your-token-here"
      }
    }
  }
}
```

#### Cursor (`~/.cursor/mcp.json`)

```json
{
  "mcpServers": {
    "machship": {
      "command": "node",
      "args": ["/path/to/machship-mcp/dist/index.js"],
      "env": {
        "MACHSHIP_API_TOKEN": "your-token-here"
      }
    }
  }
}
```

#### HTTP mode (for OpenAI, Gemini, or remote use)

```bash
MACHSHIP_API_TOKEN=your-token TRANSPORT=http PORT=3000 node dist/index.js
```

Then point your MCP client at `http://localhost:3000/mcp`.

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MACHSHIP_API_TOKEN` | Yes | — | Machship Bearer token |
| `MACHSHIP_API_URL` | No | `https://live.machship.com` | API base URL |
| `TRANSPORT` | No | `stdio` | `stdio` or `http` |
| `PORT` | No | `3000` | HTTP port (when `TRANSPORT=http`) |

## Example Usage

Once connected, you can ask your LLM:

- *"Search for freight routes from Melbourne 3000 to Sydney 2000 for a 10kg parcel"*
- *"Create a consignment for company 123 shipping to Brisbane"*
- *"Get all unmanifested consignments for company 456"*
- *"What carriers and services are available for company 789?"*
- *"Get the label PDF for consignment 12345"*
- *"Show me completed consignments from last week"*

## Development

```bash
npm run dev   # watch mode with tsx
npm run build # compile TypeScript
```

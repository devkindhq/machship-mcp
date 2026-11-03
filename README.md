# Machship MCP Server: freight quotes, bookings and labels for AI agents

[![npm](https://img.shields.io/npm/v/%40devkind%2Fmachship-mcp)](https://www.npmjs.com/package/@devkind/machship-mcp)
[![Release](https://github.com/devkindhq/machship-mcp/actions/workflows/ci-semantic-release.yml/badge.svg)](https://github.com/devkindhq/machship-mcp/actions/workflows/ci-semantic-release.yml)
[![License: ISC](https://img.shields.io/badge/license-ISC-blue.svg)](LICENSE)

Machship MCP server connects Claude Desktop, Claude Code, Cursor, VS Code and any other MCP client to the [Machship](https://machship.com) freight platform API. It has 125 tools for live rates, quotes, consignments, labels, manifests, tracking and invoices. It runs with `npx` over stdio, or as an HTTP endpoint.

## Quickstart

You need Node.js 22 or later and a Machship API token. In Machship, go to **Settings > API** and generate a token.

```bash
# Read the token without echo, so it stays out of shell history
read -rs MACHSHIP_API_TOKEN
claude mcp add --scope local machship -e MACHSHIP_API_TOKEN="$MACHSHIP_API_TOKEN" -- npx -y @devkind/machship-mcp
```

Then ask your agent: *"Ping the Machship API"*. A successful reply confirms the token.

### Install in your client

Requirements:

- Node.js 22 or later
- A Machship API token
- Claude Desktop, Claude Code, Cursor, VS Code, Windsurf, Goose, LM Studio, Warp, or another MCP client

**Standard config** works in most MCP clients:

```json
{
  "mcpServers": {
    "machship": {
      "command": "npx",
      "args": ["-y", "@devkind/machship-mcp"],
      "env": {
        "MACHSHIP_API_TOKEN": "your-token-here"
      }
    }
  }
}
```

Keep the token in your user-level client config. Do not put it in a project `.mcp.json` that you commit.

<details>
<summary>Claude Desktop</summary>

Open **Settings > Developer > Edit Config**, or edit the file directly:

- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

Add the standard config above and restart Claude Desktop.

</details>

<details>
<summary>Claude Code</summary>

Use the Quickstart command above. `--scope local` stores the token in `~/.claude.json`, outside the repository. You can also install the [Claude Code plugin](#claude-code-plugin).

</details>

<details>
<summary>Cursor</summary>

[<img src="https://cursor.com/deeplink/mcp-install-dark.svg" alt="Install in Cursor">](https://cursor.com/en/install-mcp?name=Machship%20MCP&config=eyJjb21tYW5kIjoibnB4IiwiYXJncyI6WyIteSIsIkBkZXZraW5kL21hY2hzaGlwLW1jcCJdLCJlbnYiOnsiTUFDSFNISVBfQVBJX1RPS0VOIjoieW91ci10b2tlbi1oZXJlIn19)

Or go to `Cursor Settings` > `MCP` > `Add new MCP Server`. Use type `command`, the command `npx -y @devkind/machship-mcp`, and set `MACHSHIP_API_TOKEN`.

</details>

<details>
<summary>VS Code</summary>

```bash
code --add-mcp '{"name":"machship","command":"npx","args":["-y","@devkind/machship-mcp"],"env":{"MACHSHIP_API_TOKEN":"your-token-here"}}'
```

Or follow the VS Code MCP [setup guide](https://code.visualstudio.com/docs/copilot/chat/mcp-servers#_add-an-mcp-server) with the standard config above.

</details>

<details>
<summary>Windsurf</summary>

Follow the Windsurf MCP [documentation](https://docs.windsurf.com/windsurf/cascade/mcp) and add the standard config above.

</details>

<details>
<summary>Goose</summary>

Go to `Advanced settings` > `Extensions` > `Add custom extension`. Use type `STDIO`, the command `npx -y @devkind/machship-mcp`, and set `MACHSHIP_API_TOKEN`.

</details>

<details>
<summary>LM Studio</summary>

Go to `Program` in the right sidebar > `Install` > `Edit mcp.json` and add the standard config above.

</details>

<details>
<summary>Warp</summary>

Go to `Settings` > `AI` > `Manage MCP Servers` > `+ Add`, or type `/add-mcp` in the Warp prompt. Paste the standard config above.

</details>

<details>
<summary>Docker</summary>

No image is published to a registry. Build the image from this repo:

```bash
docker build -t devkind/machship-mcp .
```

Stdio config for an MCP client:

```json
{
  "mcpServers": {
    "machship": {
      "command": "docker",
      "args": ["run", "--rm", "-i", "-e", "MACHSHIP_API_TOKEN", "devkind/machship-mcp"],
      "env": { "MACHSHIP_API_TOKEN": "your-token-here" }
    }
  }
}
```

HTTP mode on port 3000. The image sets `MCP_HOST=0.0.0.0`, so the published port accepts outside connections:

```bash
docker run --rm -e MACHSHIP_API_TOKEN -e TRANSPORT=http -p 3000:3000 devkind/machship-mcp
```

</details>

The server is also listed on [Smithery](https://smithery.ai/servers/devkind/machship-mcp).

## Tools

The server has 125 tools in 21 modules. Every tool name starts with `machship_`.

| Area | Modules | Tools |
| --- | --- | --- |
| Consignments | Consignments, PendingConsignments, Consolidation, Notes | 36 |
| Labels and documents | Labels, Attachments, CommercialInvoices | 22 |
| Accounts and access | Identities, IdentityProviders, OrganisationLinks, CustomSchemas | 28 |
| Companies, items and locations | Companies, CompanyItems, CompanyLocations, Locations | 20 |
| Rates | Quotes, Routes | 7 |
| Invoices | CarrierInvoices, FinancialInvoice | 6 |
| Manifests | Manifests | 5 |
| Connection check | Authenticate (`machship_ping`) | 1 |

A typical flow: `machship_get_companies` for the company ID, `machship_search_locations` for suburbs and postcodes, `machship_get_routes` for live rates, `machship_create_consignment` to book, a label tool, then `machship_manifest_consignments` to send the booking to the carrier. `machship_get_consignment_statuses` tracks it.

Tool text output stops at 25,000 characters. The full response is in `structuredContent`.

## Example

```json
{
  "tool": "machship_get_routes",
  "arguments": {
    "request": {
      "companyId": 1790,
      "fromLocation": { "suburb": "Melbourne", "postcode": "3000", "state": "VIC", "country": "AU" },
      "toLocation": { "suburb": "Sydney", "postcode": "2000", "state": "NSW", "country": "AU" },
      "items": [{ "weight": 10, "length": 30, "width": 30, "height": 30, "name": "Parcel", "quantity": 1 }]
    }
  }
}
```

Illustrative output:

```json
{
  "object": {
    "routes": [
      {
        "carrier": { "name": "Example Express" },
        "carrierService": { "name": "Road Express" },
        "consignmentTotal": { "totalSellPrice": 24.5 },
        "despatchOptions": [{ "etaLocal": "2026-11-05T17:00:00" }]
      }
    ]
  },
  "errors": null
}
```

## Configuration

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `MACHSHIP_API_TOKEN` | Yes | none | Machship API token, sent only to `MACHSHIP_API_URL`. The server starts without it, but every tool call fails until it is set. |
| `MACHSHIP_API_URL` | No | `https://live.machship.com` | Machship API base URL. |
| `TRANSPORT` | No | `stdio` | Set to `http` for the HTTP transport. |
| `PORT` | No | `3000` | HTTP port when `TRANSPORT=http`. |
| `MCP_HOST` | No | `127.0.0.1` | HTTP bind address when `TRANSPORT=http`. |

## Claude Code plugin

The repo root is a Claude Code plugin. It adds the Machship MCP server, pinned to a release version of `@devkind/machship-mcp` ([`.mcp.json`](.mcp.json)). When you enable the plugin, Claude Code asks for your API token and stores it as a sensitive value. You can also change the API URL.

The plugin also ships the `machship-freight` skill. The skill teaches Claude the freight workflow with exact tool names: rates, consignment, labels, manifest and tracking. It also tells Claude to ask you before it books, manifests or deletes.

Install it from this repo's marketplace (Claude Code 2.1.275 or later):

```bash
/plugin install machship --marketplace devkindhq/machship-mcp
```

The plugin will also be in the Claude plugin directory once it is listed. On older Claude Code versions, use the `claude mcp add` command in the [Quickstart](#quickstart).

## HTTP mode

```bash
MACHSHIP_API_TOKEN=your-token TRANSPORT=http npx -y @devkind/machship-mcp
```

- MCP endpoint: `POST http://localhost:3000/mcp` (Streamable HTTP, stateless, JSON responses)
- Health check: `GET http://localhost:3000/health`

By default the server listens on `127.0.0.1` only. It rejects requests whose `Host` header is not `localhost`, `127.0.0.1` or `::1`, which blocks DNS rebinding attacks from web pages. Set `MCP_HOST=0.0.0.0` to listen on all interfaces, for example in a container.

> **Warning:** HTTP mode has no authentication, and every request uses the server's Machship token. If you set `MCP_HOST` to anything other than a loopback address, put an authenticating proxy in front of the server.

## Security notes

- HTTP mode has no authentication. See [HTTP mode](#http-mode) before you set `MCP_HOST`.
- Tools can create, edit and delete live consignments, identities and organisation links. Tool annotations mark the delete and remove tools as destructive, so a client can ask you to confirm them. `machship_update_identity` sets omitted fields to null.
- Use a token with the smallest Machship permissions that your work needs.

## Development

This repo uses Yarn 1 (`yarn.lock`). Do not use `npm install`.

```bash
git clone https://github.com/devkindhq/machship-mcp.git
cd machship-mcp
yarn install
yarn lint && yarn build
MACHSHIP_API_TOKEN=your-token yarn start
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for the checks, commit style and release flow.

## Built by

Built by [Devkind](https://devkind.com.au). Maintained by the Devkind team.

## License

[ISC](LICENSE). See [CONTRIBUTING.md](CONTRIBUTING.md) and [SECURITY.md](SECURITY.md).

## Automating freight for your store?

If you ship with Machship, Devkind can connect it to the rest of your stack. We build on [Shopify](https://devkind.com.au/services/shopify), [Swell](https://devkind.com.au/services/swell) and [headless commerce](https://devkind.com.au/services/headless-ecommerce) stacks, and build custom MCP servers and AI agent workflows. [Talk to Devkind](https://devkind.com.au/services) or email [hello@devkind.com.au](mailto:hello@devkind.com.au).

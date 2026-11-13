#!/usr/bin/env node

/**
 * Writes the server's tool list into manifest.json (MCPB) so
 * registries can show tools without starting the server. server.json gets no
 * tool list: the MCP Registry caps publisher metadata at 4 KB.
 * Run after `yarn build`. Usage: node scripts/sync-manifest-tools.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const manifestPath = path.join(rootDir, 'manifest.json');

const transport = new StdioClientTransport({
	command: process.execPath,
	args: [path.join(rootDir, 'dist/index.js')],
	env: { PATH: process.env.PATH ?? '' },
});
const client = new Client({ name: 'sync-manifest-tools', version: '1.0.0' });
await client.connect(transport);
const { tools } = await client.listTools();
await client.close();

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
// Keep only the summary paragraph; the "Args:" block is already in inputSchema.
manifest.tools = tools.map((tool) => ({
	name: tool.name,
	description: (tool.description ?? '').split('\n\n')[0].trim(),
}));
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, '\t') + '\n');

console.log(`Wrote ${tools.length} tools to manifest.json`);

#!/usr/bin/env node

/**
 * Publishes a GitHub release's MCPB bundle to Smithery (devkind/machship-mcp).
 * Smithery builds its listing from manifest.json `tools` and needs full MCP
 * tool definitions (inputSchema), which the strict MCPB schema rejects. This
 * adds them to a copy of the released bundle at publish time; the release
 * itself is not changed. Needs `gh` and `smithery` logged in.
 * Usage: node scripts/publish-smithery.js <tag> [--dry-run]
 *        node scripts/publish-smithery.js --bundle <file.mcpb> [--dry-run]
 * --bundle publishes a local build instead of a release (no tag check).
 */

import { execFileSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { pathToFileURL } from 'url';
import { unzipSync, zipSync } from 'fflate';

const SERVER = 'devkind/machship-mcp';
const REPO = 'devkindhq/machship-mcp';
const ASSET = 'machship-mcp.mcpb';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const bundleArg = args.includes('--bundle')
	? args[args.indexOf('--bundle') + 1]
	: undefined;
const tag = args.find((arg) => !arg.startsWith('--') && arg !== bundleArg);
if (!tag === !bundleArg) {
	console.error(
		'Usage: node scripts/publish-smithery.js <tag> | --bundle <file.mcpb> [--dry-run]',
	);
	process.exit(1);
}

const run = (cmd, cmdArgs) => execFileSync(cmd, cmdArgs, { stdio: 'inherit' });
const names = (tools) => tools.map((tool) => tool.name).join(',');

// Archive entries without directory placeholders.
const readBundle = (file) =>
	Object.fromEntries(
		Object.entries(unzipSync(fs.readFileSync(file))).filter(
			([name]) => !name.endsWith('/'),
		),
	);

const extract = (files, dir) => {
	for (const [name, data] of Object.entries(files)) {
		const target = path.join(dir, name);
		fs.mkdirSync(path.dirname(target), { recursive: true });
		fs.writeFileSync(target, data);
	}
};

// Starts the bundled server (no token) with the bundled SDK and lists its tools.
const listTools = async (dir) => {
	const sdk = (file) =>
		pathToFileURL(
			path.join(
				dir,
				'node_modules/@modelcontextprotocol/sdk/dist/esm',
				file,
			),
		).href;
	const { Client } = await import(sdk('client/index.js'));
	const { StdioClientTransport } = await import(sdk('client/stdio.js'));
	const client = new Client({ name: 'publish-smithery', version: '1.0.0' });
	await client.connect(
		new StdioClientTransport({
			command: process.execPath,
			args: [path.join(dir, 'dist/index.js')],
			stderr: 'ignore',
		}),
	);
	const { tools } = await client.listTools();
	await client.close();
	return tools;
};

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'machship-smithery-'));
try {
	if (bundleArg) {
		fs.copyFileSync(path.resolve(bundleArg), path.join(tmp, ASSET));
	} else {
		run('gh', [
			'release',
			'download',
			tag,
			'--repo',
			REPO,
			'--pattern',
			ASSET,
			'--dir',
			tmp,
		]);
	}
	const files = readBundle(path.join(tmp, ASSET));
	const manifest = JSON.parse(
		Buffer.from(files['manifest.json']).toString('utf8'),
	);
	if (tag && `v${manifest.version}` !== tag) {
		throw new Error(
			`Bundle version ${manifest.version} does not match tag ${tag}`,
		);
	}

	const releaseDir = path.join(tmp, 'release');
	extract(files, releaseDir);
	const tools = await listTools(releaseDir);
	if (names(tools) !== names(manifest.tools ?? [])) {
		throw new Error('Server tools differ from the release manifest');
	}

	manifest.tools = tools.map(
		({
			name,
			title,
			description,
			inputSchema,
			outputSchema,
			annotations,
		}) => ({
			name,
			title,
			description,
			inputSchema,
			outputSchema,
			annotations,
		}),
	);
	files['manifest.json'] = Buffer.from(
		JSON.stringify(manifest, null, '\t') + '\n',
	);
	const bundle = path.join(tmp, 'smithery.mcpb');
	fs.writeFileSync(bundle, zipSync(files, { level: 9 }));

	// The rebuilt bundle must start and list the same tools before it is published.
	const checkDir = path.join(tmp, 'check');
	extract(readBundle(bundle), checkDir);
	if (names(await listTools(checkDir)) !== names(tools)) {
		throw new Error('Rebuilt bundle does not list the same tools');
	}

	console.log(
		`Prepared ${SERVER} ${manifest.version} with ${tools.length} tools`,
	);
	if (dryRun) {
		console.log('Dry run: not published');
	} else {
		run('smithery', ['mcp', 'publish', bundle, '-n', SERVER]);
	}
} finally {
	fs.rmSync(tmp, { recursive: true, force: true });
}

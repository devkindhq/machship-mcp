#!/usr/bin/env node

/**
 * Builds the MCPB bundle (machship-mcp.mcpb) attached to each GitHub release.
 * Packs a staging copy with production dependencies only, so dev tooling
 * never ships. Run `yarn build` first. Usage: node scripts/build-mcpb.js
 */

import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const stageDir = path.join(rootDir, '.mcpb-stage');
const outFile = path.join(rootDir, 'machship-mcp.mcpb');
const mcpb = path.join(rootDir, 'node_modules', '.bin', 'mcpb');

const run = (cmd, args, cwd = rootDir) =>
	execFileSync(cmd, args, { cwd, stdio: 'inherit' });

if (!fs.existsSync(path.join(rootDir, 'dist', 'index.js'))) {
	console.error('dist/index.js not found; run `yarn build` first');
	process.exit(1);
}

fs.rmSync(stageDir, { recursive: true, force: true });
fs.mkdirSync(stageDir);
for (const entry of [
	'dist',
	'assets',
	'manifest.json',
	'package.json',
	'yarn.lock',
	'LICENSE',
	'README.md',
]) {
	fs.cpSync(path.join(rootDir, entry), path.join(stageDir, entry), {
		recursive: true,
	});
}

// --ignore-scripts skips "prepare" (yarn build), which needs dev dependencies.
run(
	'yarn',
	['install', '--production', '--frozen-lockfile', '--ignore-scripts'],
	stageDir,
);

run(mcpb, ['validate', path.join(stageDir, 'manifest.json')]);
fs.rmSync(outFile, { force: true });
run(mcpb, ['pack', stageDir, outFile]);
fs.rmSync(stageDir, { recursive: true, force: true });

console.log(`Bundle written to ${path.relative(rootDir, outFile)}`);

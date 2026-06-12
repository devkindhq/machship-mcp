#!/usr/bin/env node

/**
 * Updates version across package.json and src/utils/constants.ts
 * Usage: node scripts/update-version.js [version] [--dry-run] [--verbose]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const args = process.argv.slice(2);
const options = {
	dryRun: args.includes('--dry-run'),
	verbose: args.includes('--verbose'),
};

let newVersion = args.find((arg) => !arg.startsWith('--'));

const log = (msg, verbose = false) => {
	if (!verbose || options.verbose) console.log(msg);
};

function getPackageVersion() {
	const pkg = JSON.parse(
		fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'),
	);
	if (!pkg.version) throw new Error('No version field in package.json');
	return pkg.version;
}

function validateVersion(v) {
	const semver =
		/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9a-zA-Z-.]+)?(?:\+[0-9a-zA-Z-.]+)?$/;
	if (!semver.test(v))
		throw new Error(`Invalid semver: ${v}`);
	return true;
}

const versionFiles = [
	{
		path: path.join(rootDir, 'package.json'),
		pattern: /"version": "([^"]*)"/,
		replacement: (match, cur) => match.replace(cur, newVersion),
	},
	{
		path: path.join(rootDir, 'src', 'utils', 'constants.ts'),
		pattern: /export const VERSION = ['"]([^'"]*)['"]/,
		replacement: (match, cur) => match.replace(cur, newVersion),
	},
	{
		path: path.join(rootDir, 'server.json'),
		pattern: /"version": "([^"]*)"/,
		replacement: (match, cur) => match.replace(cur, newVersion),
	},
	{
		path: path.join(rootDir, 'manifest.json'),
		pattern: /"version": "([^"]*)"/,
		replacement: (match, cur) => match.replace(cur, newVersion),
	},
];

function updateFile({ path: filePath, pattern, replacement, optional = false }) {
	if (!fs.existsSync(filePath)) {
		if (optional) return;
		console.warn(`Warning: file not found: ${filePath}`);
		return;
	}

	const content = fs.readFileSync(filePath, 'utf8');
	const match = content.match(pattern);
	if (!match) {
		console.warn(`Warning: version pattern not found in ${filePath}`);
		return;
	}

	const current = match[1];
	if (current === newVersion) {
		log(`Already at ${newVersion}: ${path.basename(filePath)}`, true);
		return;
	}

	const updated = content.replace(pattern, replacement);
	if (options.dryRun) {
		log(`Would update ${path.basename(filePath)}: ${current} → ${newVersion}`);
	} else {
		fs.writeFileSync(filePath, updated);
		log(`Updated ${path.basename(filePath)}: ${current} → ${newVersion}`);
	}
}

try {
	if (!newVersion) {
		newVersion = getPackageVersion();
		log(`Using version from package.json: ${newVersion}`);
	}
	validateVersion(newVersion);
	for (const file of versionFiles) updateFile(file);
	log(options.dryRun ? '\nDry run complete — no files modified.' : `\nVersion updated to ${newVersion}`);
} catch (err) {
	console.error(`Version update failed: ${err.message}`);
	process.exit(1);
}

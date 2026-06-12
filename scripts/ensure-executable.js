#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const entryPoint = path.join(rootDir, 'dist', 'index.js');

try {
	if (fs.existsSync(entryPoint)) {
		const mode = fs.statSync(entryPoint).mode;
		const isExecutable =
			mode & fs.constants.S_IXUSR ||
			mode & fs.constants.S_IXGRP ||
			mode & fs.constants.S_IXOTH;

		if (!isExecutable) {
			fs.chmodSync(entryPoint, 0o755);
			console.log(`Made ${path.relative(rootDir, entryPoint)} executable`);
		}
	}
} catch (_err) {
	// Non-fatal — chmod is best-effort
}

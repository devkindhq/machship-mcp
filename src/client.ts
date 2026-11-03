import axios, { AxiosError, type AxiosRequestConfig } from 'axios';
import { z } from 'zod';
import { API_BASE_URL, CHARACTER_LIMIT } from './constants.js';

export const ResponseFormat = {
	JSON: 'json',
	MARKDOWN: 'markdown',
} as const;
export type ResponseFormat =
	(typeof ResponseFormat)[keyof typeof ResponseFormat];

type McpToolResult = {
	isError?: boolean;
	content: [{ type: 'text'; text: string }];
	structuredContent?: Record<string, unknown>;
};

/**
 * Output schema shared by every tool. Machship wraps responses as
 * `{ object, errors }`; successResponse wraps any other payload as `{ object }`.
 */
export const resultSchema = z
	.object({
		// zod 4 marks z.unknown() keys required; a record payload can lack "object".
		object: z
			.unknown()
			.optional()
			.describe('Response payload from the Machship API'),
		errors: z
			.array(z.unknown())
			.nullish()
			.describe('Validation errors returned by Machship, if any'),
	})
	.passthrough();

/** The token is optional at install time, so every call checks it here. */
export function requireToken(): string {
	const token = process.env.MACHSHIP_API_TOKEN;
	if (!token) {
		throw new Error(
			'Machship API token is not set. Add it in the server settings (machship_api_token) or set the MACHSHIP_API_TOKEN environment variable.',
		);
	}
	return token;
}

function getAuthHeaders(): Record<string, string> {
	return {
		'Content-Type': 'application/json',
		Accept: 'application/json',
		token: requireToken(),
	};
}

export async function apiGet<T>(
	path: string,
	params?: Record<string, unknown>,
): Promise<T> {
	const config: AxiosRequestConfig = {
		method: 'GET',
		url: `${API_BASE_URL}${path}`,
		params,
		headers: getAuthHeaders(),
		timeout: 30000,
	};
	const response = await axios(config);
	return response.data as T;
}

export async function apiPost<T>(
	path: string,
	data?: unknown,
	params?: Record<string, unknown>,
): Promise<T> {
	const config: AxiosRequestConfig = {
		method: 'POST',
		url: `${API_BASE_URL}${path}`,
		data,
		params,
		headers: getAuthHeaders(),
		timeout: 30000,
	};
	const response = await axios(config);
	return response.data as T;
}

export type FileResult = {
	fileBase64: string;
	contentType: string;
	sizeBytes: number;
};

/** For endpoints that return raw file bytes (PDF, zip) instead of JSON. */
export async function apiFile(
	method: 'GET' | 'POST',
	path: string,
	params?: Record<string, unknown>,
	data?: unknown,
): Promise<FileResult> {
	const response = await axios({
		method,
		url: `${API_BASE_URL}${path}`,
		params,
		data,
		headers: { ...getAuthHeaders(), Accept: '*/*' },
		timeout: 30000,
		// The default JSON mode decodes bytes as UTF-8 text and damages the file.
		responseType: 'arraybuffer',
	});
	const bytes = Buffer.from(response.data as ArrayBuffer);
	return {
		fileBase64: bytes.toString('base64'),
		contentType: String(
			response.headers['content-type'] ?? 'application/octet-stream',
		),
		sizeBytes: bytes.length,
	};
}

export async function apiDelete<T>(
	path: string,
	params?: Record<string, unknown>,
): Promise<T> {
	const config: AxiosRequestConfig = {
		method: 'DELETE',
		url: `${API_BASE_URL}${path}`,
		params,
		headers: getAuthHeaders(),
		timeout: 30000,
	};
	const response = await axios(config);
	return response.data as T;
}

export function handleApiError(error: unknown): string {
	if (error instanceof AxiosError) {
		if (error.response) {
			const status = error.response.status;
			let body: unknown = error.response.data;
			// A file request gets its error body as bytes too.
			if (body instanceof ArrayBuffer || Buffer.isBuffer(body)) {
				const text = Buffer.from(body as ArrayBuffer).toString('utf8');
				try {
					body = JSON.parse(text);
				} catch {
					body = text;
				}
			}
			const detail = body ? JSON.stringify(body) : error.message;
			switch (status) {
				case 400:
					return `Error 400: Bad request — ${detail}. Check parameter types and required fields.`;
				case 401:
					return 'Error 401: Unauthorized. Check your MACHSHIP_API_TOKEN environment variable.';
				case 403:
					return 'Error 403: Forbidden. Your token lacks permission for this resource.';
				case 404:
					return 'Error 404: Resource not found. Verify the ID exists and is accessible.';
				case 429:
					return 'Error 429: Rate limit exceeded. Wait a moment before retrying.';
				case 500:
					return `Error 500: Machship server error — ${detail}. Try again or contact support.`;
				default:
					return `Error ${status}: ${detail}`;
			}
		} else if (error.code === 'ECONNABORTED') {
			return 'Error: Request timed out (30s). Check connectivity or try a narrower query.';
		} else if (error.code === 'ENOTFOUND') {
			return 'Error: Cannot reach Machship API. Check network connectivity and MACHSHIP_API_URL.';
		}
		return `Error: ${error.message}`;
	}
	return `Error: ${error instanceof Error ? error.message : String(error)}`;
}

/** Returns a properly-formed MCP error result with isError: true. */
export function errorResponse(error: unknown): McpToolResult {
	return {
		isError: true,
		content: [{ type: 'text' as const, text: handleApiError(error) }],
	};
}

/** Returns a success result with both text content and structuredContent. */
export function successResponse(
	data: unknown,
	format: ResponseFormat = ResponseFormat.JSON,
): McpToolResult {
	const text =
		format === ResponseFormat.MARKDOWN
			? toMarkdown(data)
			: truncate(JSON.stringify(data, null, 2));
	// structuredContent must be an object (MCP spec and resultSchema).
	const isRecord =
		typeof data === 'object' && data !== null && !Array.isArray(data);
	return {
		content: [{ type: 'text' as const, text }],
		structuredContent: isRecord
			? (data as Record<string, unknown>)
			: { object: data },
	};
}

export function fileResponse(file: FileResult): McpToolResult {
	const full = JSON.stringify(file, null, 2);
	// Cut base64 decodes to a damaged file, so never truncate it.
	const text =
		full.length <= CHARACTER_LIMIT
			? full
			: JSON.stringify(
					{
						contentType: file.contentType,
						sizeBytes: file.sizeBytes,
						note: `fileBase64 is over the ${CHARACTER_LIMIT}-character text limit. Read it from structuredContent.fileBase64.`,
					},
					null,
					2,
				);
	return {
		content: [{ type: 'text' as const, text }],
		structuredContent: file,
	};
}

export function truncate(text: string, limit = CHARACTER_LIMIT): string {
	if (text.length <= limit) return text;
	return (
		text.slice(0, limit) +
		`\n\n[TRUNCATED: response exceeded ${limit} characters. Use pagination or narrower filters.]`
	);
}

/** Formats arbitrary API data as human-readable markdown. */
export function toMarkdown(data: unknown): string {
	if (data === null || data === undefined) return '_No data returned._';

	if (Array.isArray(data)) {
		if (data.length === 0) return '_No results found._';
		const lines: string[] = [`_${data.length} result(s)_`, ''];
		data.forEach((item, i) => {
			lines.push(`### #${i + 1}`);
			lines.push(objectToMarkdownFields(item));
			lines.push('');
		});
		return truncate(lines.join('\n'));
	}

	if (typeof data === 'object') {
		return truncate(objectToMarkdownFields(data));
	}

	return truncate(String(data));
}

function objectToMarkdownFields(obj: unknown): string {
	if (typeof obj !== 'object' || obj === null) return String(obj);
	const lines: string[] = [];
	for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
		if (value === null || value === undefined) continue;
		if (typeof value === 'object') {
			lines.push(`- **${key}**: ${JSON.stringify(value)}`);
		} else {
			lines.push(`- **${key}**: ${value}`);
		}
	}
	return lines.join('\n');
}

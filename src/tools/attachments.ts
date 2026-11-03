import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import {
	apiFile,
	apiPost,
	errorResponse,
	fileResponse,
	resultSchema,
	successResponse,
} from '../client.js';

export function registerAttachmentsTools(server: McpServer): void {
	server.registerTool(
		'machship_get_attachment',
		{
			title: 'Get Attachment',
			description: `Downloads the raw attachment file from Machship by attachment ID.
Returns { fileBase64, contentType, sizeBytes }. contentType comes from the response header.

Args:
  - id (number): Attachment ID`,
			inputSchema: z
				.object({
					id: z.number().int().positive().describe('Attachment ID'),
				})
				.strict(),
			outputSchema: resultSchema,
			annotations: {
				readOnlyHint: true,
				destructiveHint: false,
				idempotentHint: true,
				openWorldHint: true,
			},
		},
		async ({ id }) => {
			try {
				return fileResponse(
					await apiFile('GET', '/apiv2/attachments/getAttachment', {
						id,
					}),
				);
			} catch (e) {
				return errorResponse(e);
			}
		},
	);

	server.registerTool(
		'machship_get_attachment_pod_report',
		{
			title: 'Get Attachment POD Report',
			description: `Downloads a Proof of Delivery (POD) report that includes attachment and consignment details.
Returns { fileBase64, contentType, sizeBytes }. contentType comes from the response header.

Args:
  - id (number): Attachment ID`,
			inputSchema: z
				.object({
					id: z.number().int().positive().describe('Attachment ID'),
				})
				.strict(),
			outputSchema: resultSchema,
			annotations: {
				readOnlyHint: true,
				destructiveHint: false,
				idempotentHint: true,
				openWorldHint: true,
			},
		},
		async ({ id }) => {
			try {
				return fileResponse(
					await apiFile(
						'GET',
						'/apiv2/attachments/getAttachmentPodReport',
						{ id },
					),
				);
			} catch (e) {
				return errorResponse(e);
			}
		},
	);

	server.registerTool(
		'machship_get_attachments_by_consignment_ids',
		{
			title: 'Get Attachments by Consignment IDs',
			description: `Downloads attachments for up to 40 consignments in bulk (returned as zip).
Returns { fileBase64, contentType, sizeBytes }. contentType comes from the response header.

Args:
  - ids (number[]): Array of consignment IDs (max 40)`,
			inputSchema: z
				.object({
					ids: z
						.array(z.number().int().positive())
						.min(1)
						.max(40)
						.describe('Consignment IDs (max 40)'),
				})
				.strict(),
			outputSchema: resultSchema,
			annotations: {
				readOnlyHint: true,
				destructiveHint: false,
				idempotentHint: true,
				openWorldHint: true,
			},
		},
		async ({ ids }) => {
			try {
				return fileResponse(
					await apiFile(
						'GET',
						'/apiv2/attachments/getAttachmentsByConsignmentIds',
						{ ids },
					),
				);
			} catch (e) {
				return errorResponse(e);
			}
		},
	);

	server.registerTool(
		'machship_upload_attachments',
		{
			title: 'Upload Attachments',
			description: `Uploads one or more attachments to Machship.

Args:
  - attachments (array): Array of attachment objects. Each object should contain:
    - consignmentId (number): Consignment to attach to
    - fileName (string): File name with extension
    - fileBase64 (string): Base64-encoded file content
    - attachmentTypeId (number, optional): Type of attachment`,
			inputSchema: z
				.object({
					attachments: z
						.array(
							z.object({
								consignmentId: z
									.number()
									.int()
									.positive()
									.describe('Consignment ID'),
								fileName: z
									.string()
									.describe('File name with extension'),
								fileBase64: z
									.string()
									.describe('Base64-encoded file content'),
								attachmentTypeId: z
									.number()
									.int()
									.optional()
									.describe('Attachment type ID'),
							}),
						)
						.min(1)
						.describe('Attachments to upload'),
				})
				.strict(),
			outputSchema: resultSchema,
			annotations: {
				readOnlyHint: false,
				destructiveHint: false,
				idempotentHint: false,
				openWorldHint: true,
			},
		},
		async ({ attachments }) => {
			try {
				const data = await apiPost<unknown>(
					'/apiv2/attachments/uploadAttachments',
					attachments,
				);
				return successResponse(data);
			} catch (e) {
				return errorResponse(e);
			}
		},
	);
}

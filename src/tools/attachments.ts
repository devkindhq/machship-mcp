import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { apiGet, apiPost, errorResponse, successResponse } from "../client.js";

export function registerAttachmentsTools(server: McpServer): void {
  server.registerTool(
    "machship_get_attachment",
    {
      title: "Get Attachment",
      description: `Downloads raw attachment file bytes from Machship by attachment ID.
Returns base64-encoded file content.

Args:
  - id (number): Attachment ID`,
      inputSchema: z.object({
        id: z.number().int().positive().describe("Attachment ID")
      }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async ({ id }) => {
      try {
        const data = await apiGet<unknown>("/apiv2/attachments/getAttachment", { id });
        return successResponse(data);
      } catch (e) {
        return errorResponse(e);
      }
    }
  );

  server.registerTool(
    "machship_get_attachment_pod_report",
    {
      title: "Get Attachment POD Report",
      description: `Downloads a Proof of Delivery (POD) report that includes attachment and consignment details.

Args:
  - id (number): Attachment ID`,
      inputSchema: z.object({
        id: z.number().int().positive().describe("Attachment ID")
      }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async ({ id }) => {
      try {
        const data = await apiGet<unknown>("/apiv2/attachments/getAttachmentPodReport", { id });
        return successResponse(data);
      } catch (e) {
        return errorResponse(e);
      }
    }
  );

  server.registerTool(
    "machship_get_attachments_by_consignment_ids",
    {
      title: "Get Attachments by Consignment IDs",
      description: `Downloads attachments for up to 40 consignments in bulk (returned as zip).

Args:
  - ids (number[]): Array of consignment IDs (max 40)`,
      inputSchema: z.object({
        ids: z.array(z.number().int().positive()).min(1).max(40).describe("Consignment IDs (max 40)")
      }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async ({ ids }) => {
      try {
        const data = await apiGet<unknown>("/apiv2/attachments/getAttachmentsByConsignmentIds", { ids });
        return successResponse(data);
      } catch (e) {
        return errorResponse(e);
      }
    }
  );

  server.registerTool(
    "machship_upload_attachments",
    {
      title: "Upload Attachments",
      description: `Uploads one or more attachments to Machship.

Args:
  - attachments (array): Array of attachment objects. Each object should contain:
    - consignmentId (number): Consignment to attach to
    - fileName (string): File name with extension
    - fileBase64 (string): Base64-encoded file content
    - attachmentTypeId (number, optional): Type of attachment`,
      inputSchema: z.object({
        attachments: z.array(z.object({
          consignmentId: z.number().int().positive().describe("Consignment ID"),
          fileName: z.string().describe("File name with extension"),
          fileBase64: z.string().describe("Base64-encoded file content"),
          attachmentTypeId: z.number().int().optional().describe("Attachment type ID")
        })).min(1).describe("Attachments to upload")
      }).strict(),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true }
    },
    async ({ attachments }) => {
      try {
        const data = await apiPost<unknown>("/apiv2/attachments/uploadAttachments", attachments);
        return successResponse(data);
      } catch (e) {
        return errorResponse(e);
      }
    }
  );
}

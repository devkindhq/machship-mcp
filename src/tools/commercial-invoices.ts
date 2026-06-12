import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { errorResponse, successResponse } from "../client.js";
import axios from "axios";
import FormData from "form-data";
import { API_BASE_URL } from "../constants.js";

export function registerCommercialInvoicesTools(server: McpServer): void {
  server.registerTool(
    "machship_upload_commercial_invoice",
    {
      title: "Upload Commercial Invoice",
      description: `Uploads one or more commercial invoice files for a consignment (for international shipments).
Files are provided as base64-encoded content.

Args:
  - consignmentId (number): The consignment to attach the invoice to
  - files (array): Array of files, each with fileName and fileBase64 content`,
      inputSchema: z.object({
        consignmentId: z.number().int().positive().describe("Consignment ID"),
        files: z.array(z.object({
          fileName: z.string().describe("File name with extension"),
          fileBase64: z.string().describe("Base64-encoded file content")
        })).min(1).describe("Invoice files to upload")
      }).strict(),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true }
    },
    async ({ consignmentId, files }) => {
      try {
        const token = process.env.MACHSHIP_API_TOKEN;
        if (!token) throw new Error("MACHSHIP_API_TOKEN environment variable is required");

        const form = new FormData();
        for (const f of files) {
          const buffer = Buffer.from(f.fileBase64, "base64");
          form.append("files", buffer, f.fileName);
        }

        const response = await axios.post(
          `${API_BASE_URL}/apiv2/commercialInvoices/uploadCommercialInvoice`,
          form,
          {
            params: { consignmentId },
            headers: {
              ...form.getHeaders(),
              Authorization: `Bearer ${token}`
            },
            timeout: 30000
          }
        );
        return successResponse(response.data);
      } catch (e) {
        return errorResponse(e);
      }
    }
  );
}

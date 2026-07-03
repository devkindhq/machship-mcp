import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { apiGet, errorResponse, successResponse } from "../client.js";

export function registerFinancialInvoicesTools(server: McpServer): void {
  server.registerTool(
    "machship_get_posted_invoices",
    {
      title: "Get Posted Financial Invoices",
      description: `Returns posted financial invoices within an optional date range (max 100 per call).

Args:
  - startDate (string, optional): Start date filter (ISO 8601)
  - endDate (string, optional): End date filter (ISO 8601)
  - startIndex (number, optional): Pagination start index (default 1)
  - retrieveSize (number, optional): Number to retrieve (default 100, max 100)`,
      inputSchema: z.object({
        startDate: z.string().optional().describe("Start date filter (ISO 8601)"),
        endDate: z.string().optional().describe("End date filter (ISO 8601)"),
        startIndex: z.number().int().min(1).default(1).optional().describe("Pagination start index (default 1)"),
        retrieveSize: z.number().int().min(1).max(100).default(100).optional().describe("Number of results to return (default 100, max 100)")
      }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async (params) => {
      try {
        const data = await apiGet<unknown>("/apiv2/financialInvoice/getAllPosted", params);
        return successResponse(data);
      } catch (e) {
        return errorResponse(e);
      }
    }
  );

  server.registerTool(
    "machship_get_invoice_by_document_number",
    {
      title: "Get Financial Invoice by Document Number",
      description: `Returns a specific financial invoice by document number, with optional PDF download.

Args:
  - documentNumber (string): Invoice document number
  - returnPdfFileBytes (boolean, optional): Include PDF as base64 bytes in response`,
      inputSchema: z.object({
        documentNumber: z.string().min(1).describe("Invoice document number"),
        returnPdfFileBytes: z.boolean().optional().describe("Include PDF as base64 bytes")
      }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async ({ documentNumber, returnPdfFileBytes }) => {
      try {
        const data = await apiGet<unknown>("/apiv2/financialInvoice/getPostedInvoiceByDocumentNumber", { documentNumber, returnPdfFileBytes });
        return successResponse(data);
      } catch (e) {
        return errorResponse(e);
      }
    }
  );
}

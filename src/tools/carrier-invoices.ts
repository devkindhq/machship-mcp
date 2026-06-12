import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { apiGet, apiPost, errorResponse, successResponse } from "../client.js";

export function registerCarrierInvoicesTools(server: McpServer): void {
  server.registerTool(
    "machship_get_carrier_invoices",
    {
      title: "Get Carrier Invoices",
      description: `Returns basic carrier invoice information (max 100 records per call).

Args:
  - companyId (number, optional): Filter by company ID
  - carrierId (number, optional): Filter by carrier ID
  - fileName (string, optional): Filter by invoice file name
  - invoiceId (number, optional): Filter by specific invoice ID`,
      inputSchema: z.object({
        companyId: z.number().int().positive().optional().describe("Filter by company ID"),
        carrierId: z.number().int().positive().optional().describe("Filter by carrier ID"),
        fileName: z.string().optional().describe("Filter by invoice file name"),
        invoiceId: z.number().int().positive().optional().describe("Filter by invoice ID")
      }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async (params) => {
      try {
        const data = await apiGet<unknown>("/apiv2/carrierInvoices/getAll", params);
        return successResponse(data);
      } catch (e) {
        return errorResponse(e);
      }
    }
  );

  server.registerTool(
    "machship_get_carrier_invoice_entries",
    {
      title: "Get Carrier Invoice Entries",
      description: `Gets carrier invoice line entries with optional status filtering.

Args:
  - carrierInvoiceId (number): The carrier invoice ID
  - status (string, optional): Filter entries by status`,
      inputSchema: z.object({
        carrierInvoiceId: z.number().int().positive().describe("Carrier invoice ID"),
        status: z.string().optional().describe("Filter by entry status")
      }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async ({ carrierInvoiceId, status }) => {
      try {
        const data = await apiGet<unknown>("/apiv2/carrierInvoices/getEntriesForInvoice", { carrierInvoiceId, status });
        return successResponse(data);
      } catch (e) {
        return errorResponse(e);
      }
    }
  );

  server.registerTool(
    "machship_update_reprice_consignment",
    {
      title: "Update and Reprice Consignment",
      description: `Updates consignment items on a carrier invoice entry and triggers repricing.
Use for reconciling carrier invoice discrepancies.

Args:
  - body (object): Repricing request payload (consignmentId, items, etc.)`,
      inputSchema: z.object({
        body: z.record(z.unknown()).describe("Repricing request payload")
      }).strict(),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true }
    },
    async ({ body }) => {
      try {
        const data = await apiPost<unknown>("/apiv2/carrierInvoices/updateAndRepriceConsignment", body);
        return successResponse(data);
      } catch (e) {
        return errorResponse(e);
      }
    }
  );

  server.registerTool(
    "machship_attempt_auto_reconciliation",
    {
      title: "Attempt Auto Reconciliation",
      description: `Attempts automatic reconciliation of carrier invoices based on configured carrier thresholds.

Args:
  - body (object): Reconciliation request payload (carrierInvoiceId, etc.)`,
      inputSchema: z.object({
        body: z.record(z.unknown()).describe("Reconciliation request payload")
      }).strict(),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true }
    },
    async ({ body }) => {
      try {
        const data = await apiPost<unknown>("/apiv2/carrierInvoices/attemptAutoReconciliation", body);
        return successResponse(data);
      } catch (e) {
        return errorResponse(e);
      }
    }
  );
}

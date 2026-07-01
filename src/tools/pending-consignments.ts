import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { apiGet, apiPost, errorResponse, successResponse } from "../client.js";

export function registerPendingConsignmentsTools(server: McpServer): void {
  server.registerTool(
    "machship_create_pending_consignment",
    {
      title: "Create Pending Consignment",
      description: `Creates a pending consignment — a draft/staging consignment that hasn't been rated or assigned to a carrier yet.
Pending consignments can be converted to full consignments after quoting.

Args:
  - consignment (object): Pending consignment data including companyId, from/to address, items, references, etc.`,
      inputSchema: z.object({
        consignment: z.record(z.unknown()).describe("Pending consignment data (companyId, fromAddress, toAddress, items, reference1, reference2)")
      }).strict(),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true }
    },
    async ({ consignment }) => {
      try {
        const data = await apiPost<unknown>("/apiv2/pendingConsignments/createPendingConsignment", consignment);
        return successResponse(data);
      } catch (e) {
        return errorResponse(e);
      }
    }
  );

  server.registerTool(
    "machship_get_pending_consignment",
    {
      title: "Get Pending Consignment",
      description: `Returns details for a single pending consignment by ID.

Args:
  - id (number): Pending consignment ID`,
      inputSchema: z.object({
        id: z.number().int().positive().describe("Pending consignment ID")
      }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async ({ id }) => {
      try {
        const data = await apiGet<unknown>("/apiv2/pendingConsignments/getPendingConsignment", { id });
        return successResponse(data);
      } catch (e) {
        return errorResponse(e);
      }
    }
  );

  server.registerTool(
    "machship_get_pending_consignments_by_ids",
    {
      title: "Get Pending Consignments by IDs (Batch)",
      description: `Returns details for multiple pending consignments by IDs (max 10 per request).

Args:
  - ids (number[]): Pending consignment IDs (max 10)`,
      inputSchema: z.object({
        ids: z.array(z.number().int().positive()).min(1).max(10).describe("Pending consignment IDs (max 10)")
      }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async ({ ids }) => {
      try {
        const data = await apiPost<unknown>("/apiv2/pendingConsignments/returnPendingConsignments", { ids });
        return successResponse(data);
      } catch (e) {
        return errorResponse(e);
      }
    }
  );

  server.registerTool(
    "machship_get_pending_consignments_by_reference1",
    {
      title: "Get Pending Consignments by Reference 1",
      description: `Finds pending consignments by Reference 1 field. Max 10 per request.

Args:
  - references (string[]): Reference 1 values (max 10)`,
      inputSchema: z.object({
        references: z.array(z.string().min(1)).min(1).max(10).describe("Reference 1 values (max 10)")
      }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async ({ references }) => {
      try {
        const data = await apiPost<unknown>("/apiv2/pendingConsignments/returnPendingConsignmentsByReference1", references);
        return successResponse(data);
      } catch (e) {
        return errorResponse(e);
      }
    }
  );

  server.registerTool(
    "machship_get_pending_consignments_by_reference2",
    {
      title: "Get Pending Consignments by Reference 2",
      description: `Finds pending consignments by Reference 2 field. Max 10 per request.

Args:
  - references (string[]): Reference 2 values (max 10)`,
      inputSchema: z.object({
        references: z.array(z.string().min(1)).min(1).max(10).describe("Reference 2 values (max 10)")
      }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async ({ references }) => {
      try {
        const data = await apiPost<unknown>("/apiv2/pendingConsignments/returnPendingConsignmentsByReference2", references);
        return successResponse(data);
      } catch (e) {
        return errorResponse(e);
      }
    }
  );

  server.registerTool(
    "machship_get_recent_pending_consignments",
    {
      title: "Get Recently Created/Updated Pending Consignments",
      description: `Returns pending consignments created or updated within a UTC date range. Useful for sync workflows.

Args:
  - companyId (number): Company ID
  - fromDateUtc (string): Start datetime UTC (ISO 8601)
  - toDateUtc (string): End datetime UTC (ISO 8601)
  - startIndex (number, optional): Pagination start
  - retrieveSize (number, optional): Page size
  - carrierId (number, optional): Filter by carrier
  - includeChildCompanies (boolean, optional): Include sub-companies
  - getDeleted (boolean, optional): Include deleted pending consignments`,
      inputSchema: z.object({
        companyId: z.number().int().positive().describe("Company ID"),
        fromDateUtc: z.string().describe("Start datetime UTC (ISO 8601)"),
        toDateUtc: z.string().describe("End datetime UTC (ISO 8601)"),
        startIndex: z.number().int().min(1).optional().describe("Pagination start index"),
        retrieveSize: z.number().int().min(1).max(200).optional().describe("Number of results to return (max 200)"),
        carrierId: z.number().int().positive().optional().describe("Filter by carrier ID"),
        includeChildCompanies: z.boolean().optional().describe("Include pending consignments from child companies"),
        getDeleted: z.boolean().optional().describe("Include deleted pending consignments")
      }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async (params) => {
      try {
        const data = await apiGet<unknown>("/apiv2/pendingConsignments/getRecentlyCreatedOrUpdatedPendingConsignments", params);
        return successResponse(data);
      } catch (e) {
        return errorResponse(e);
      }
    }
  );

  server.registerTool(
    "machship_delete_pending_consignments",
    {
      title: "Delete Pending Consignments",
      description: `Deletes one or more pending consignments.

Args:
  - ids (number[]): Pending consignment IDs to delete`,
      inputSchema: z.object({
        ids: z.array(z.number().int().positive()).min(1).describe("Pending consignment IDs to delete")
      }).strict(),
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: true }
    },
    async ({ ids }) => {
      try {
        const data = await apiPost<unknown>("/apiv2/pendingConsignments/deletePendingConsignments", ids);
        return successResponse(data);
      } catch (e) {
        return errorResponse(e);
      }
    }
  );
}

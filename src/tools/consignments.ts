import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { apiGet, apiPost, errorResponse, successResponse } from "../client.js";

export function registerConsignmentsTools(server: McpServer): void {
  server.registerTool(
    "machship_get_consignment",
    {
      title: "Get Consignment",
      description: `Returns full details for a single consignment by ID.

Args:
  - id (number): Consignment ID
  - includeDeleted (boolean, optional): Include deleted consignments
  - includeRequestGuids (boolean, optional): Include request GUIDs in response`,
      inputSchema: z.object({
        id: z.number().int().positive().describe("Consignment ID"),
        includeDeleted: z.boolean().optional().describe("Include deleted consignments"),
        includeRequestGuids: z.boolean().optional().describe("Include request GUIDs")
      }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async (params) => {
      try {
        const data = await apiGet<unknown>("/apiv2/consignments/getConsignment", params);
        return successResponse(data);
      } catch (e) {
        return errorResponse(e);
      }
    }
  );

  server.registerTool(
    "machship_get_consignments_by_ids",
    {
      title: "Get Consignments by IDs (Batch)",
      description: `Returns details for multiple consignments by their IDs (max 100 per request).

Args:
  - ids (number[]): Array of consignment IDs (max 100)`,
      inputSchema: z.object({
        ids: z.array(z.number().int().positive()).min(1).max(100).describe("Consignment IDs (max 100)")
      }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async ({ ids }) => {
      try {
        const data = await apiPost<unknown>("/apiv2/consignments/returnConsignments", { ids });
        return successResponse(data);
      } catch (e) {
        return errorResponse(e);
      }
    }
  );

  server.registerTool(
    "machship_get_consignments_by_reference1",
    {
      title: "Get Consignments by Reference 1",
      description: `Finds consignments by their Reference 1 field (order number, etc). Max 10 per request.

Args:
  - references (string[]): Array of Reference 1 values (max 10)`,
      inputSchema: z.object({
        references: z.array(z.string().min(1)).min(1).max(10).describe("Reference 1 values (max 10)")
      }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async ({ references }) => {
      try {
        const data = await apiPost<unknown>("/apiv2/consignments/returnConsignmentsByReference1", references);
        return successResponse(data);
      } catch (e) {
        return errorResponse(e);
      }
    }
  );

  server.registerTool(
    "machship_get_consignments_by_reference2",
    {
      title: "Get Consignments by Reference 2",
      description: `Finds consignments by their Reference 2 field. Max 10 per request.

Args:
  - references (string[]): Array of Reference 2 values (max 10)`,
      inputSchema: z.object({
        references: z.array(z.string().min(1)).min(1).max(10).describe("Reference 2 values (max 10)")
      }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async ({ references }) => {
      try {
        const data = await apiPost<unknown>("/apiv2/consignments/returnConsignmentsByReference2", references);
        return successResponse(data);
      } catch (e) {
        return errorResponse(e);
      }
    }
  );

  server.registerTool(
    "machship_get_consignments_by_carrier_id",
    {
      title: "Get Consignments by Carrier Consignment ID",
      description: `Finds consignments by carrier's own consignment/tracking ID. Max 10 per request.

Args:
  - carrierConsignmentIds (string[]): Array of carrier consignment IDs (max 10)`,
      inputSchema: z.object({
        carrierConsignmentIds: z.array(z.string().min(1)).min(1).max(10).describe("Carrier consignment IDs (max 10)")
      }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async ({ carrierConsignmentIds }) => {
      try {
        const data = await apiPost<unknown>("/apiv2/consignments/returnConsignmentsByCarrierConsignmentId", carrierConsignmentIds);
        return successResponse(data);
      } catch (e) {
        return errorResponse(e);
      }
    }
  );

  server.registerTool(
    "machship_get_consignment_statuses",
    {
      title: "Get Consignment Tracking Statuses",
      description: `Returns tracking/delivery statuses for a batch of consignments, with optional date filter.

Args:
  - ids (number[]): Consignment IDs
  - sinceDateCreatedUtc (string, optional): Only return statuses since this UTC datetime (ISO 8601)`,
      inputSchema: z.object({
        ids: z.array(z.number().int().positive()).min(1).describe("Consignment IDs"),
        sinceDateCreatedUtc: z.string().optional().describe("Filter: only statuses since this UTC datetime (ISO 8601)")
      }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async ({ ids, sinceDateCreatedUtc }) => {
      try {
        const data = await apiPost<unknown>("/apiv2/consignments/returnConsignmentStatuses", { ids }, sinceDateCreatedUtc ? { sinceDateCreatedUtc } : undefined);
        return successResponse(data);
      } catch (e) {
        return errorResponse(e);
      }
    }
  );

  server.registerTool(
    "machship_update_consignment_statuses",
    {
      title: "Update Consignment Tracking Statuses",
      description: `Manually updates tracking statuses for consignments (e.g. mark as delivered).

Args:
  - statuses (array): Array of manual tracking status objects, each with consignmentId, status, and datetime`,
      inputSchema: z.object({
        statuses: z.array(z.object({
          consignmentId: z.number().int().positive().describe("Consignment ID"),
          status: z.string().describe("Status value"),
          dateTimeUtc: z.string().optional().describe("Status datetime (ISO 8601 UTC)")
        })).min(1).describe("Tracking status updates")
      }).strict(),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true }
    },
    async ({ statuses }) => {
      try {
        const data = await apiPost<unknown>("/apiv2/consignments/updateConsignmentStatuses", statuses);
        return successResponse(data);
      } catch (e) {
        return errorResponse(e);
      }
    }
  );

  server.registerTool(
    "machship_get_unmanifested_consignments",
    {
      title: "Get Unmanifested Consignments",
      description: `Returns consignments that have been created but not yet manifested (booked with carrier).

Args:
  - companyId (number): Company ID
  - startIndex (number, optional): Pagination start index
  - retrieveSize (number, optional): Number to retrieve
  - carrierId (number, optional): Filter by carrier
  - includeChildCompanies (boolean, optional): Include sub-companies`,
      inputSchema: z.object({
        companyId: z.number().int().positive().describe("Company ID"),
        startIndex: z.number().int().min(1).default(1).optional().describe("Pagination start index"),
        retrieveSize: z.number().int().min(1).max(200).default(40).optional().describe("Items to retrieve"),
        carrierId: z.number().int().positive().optional().describe("Filter by carrier ID"),
        includeChildCompanies: z.boolean().optional().describe("Include child companies")
      }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async (params) => {
      try {
        const data = await apiGet<unknown>("/apiv2/consignments/getUnmanifested", params);
        return successResponse(data);
      } catch (e) {
        return errorResponse(e);
      }
    }
  );

  server.registerTool(
    "machship_get_active_consignments",
    {
      title: "Get Active Consignments",
      description: `Returns all active (in-transit) consignments for a company.

Args:
  - companyId (number): Company ID
  - startIndex (number, optional): Pagination start index
  - retrieveSize (number, optional): Number to retrieve
  - carrierId (number, optional): Filter by carrier
  - includeChildCompanies (boolean, optional): Include sub-companies`,
      inputSchema: z.object({
        companyId: z.number().int().positive().describe("Company ID"),
        startIndex: z.number().int().min(1).default(1).optional().describe("Pagination start index"),
        retrieveSize: z.number().int().min(1).max(200).default(40).optional().describe("Items to retrieve"),
        carrierId: z.number().int().positive().optional().describe("Filter by carrier ID"),
        includeChildCompanies: z.boolean().optional().describe("Include child companies")
      }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async (params) => {
      try {
        const data = await apiGet<unknown>("/apiv2/consignments/getActive", params);
        return successResponse(data);
      } catch (e) {
        return errorResponse(e);
      }
    }
  );

  server.registerTool(
    "machship_get_all_consignments",
    {
      title: "Get All Consignments",
      description: `Returns all consignments for a company with date range and status filtering.

Args:
  - companyId (number): Company ID
  - startIndex (number, optional): Pagination start index
  - retrieveSize (number, optional): Number to retrieve
  - carrierId (number, optional): Filter by carrier
  - includeChildCompanies (boolean, optional): Include sub-companies
  - includeDeletedConsignments (boolean, optional): Include deleted
  - fromDateTimeLocal (string, optional): Start date filter (local time)
  - toDateTimeLocal (string, optional): End date filter (local time)
  - filterByEtaCompletedOrDespatch (string, optional): Filter by ETA/despatch status`,
      inputSchema: z.object({
        companyId: z.number().int().positive().describe("Company ID"),
        startIndex: z.number().int().min(1).default(1).optional().describe("Pagination start index (default 1)"),
        retrieveSize: z.number().int().min(1).max(200).default(40).optional().describe("Number of results to return (default 40, max 200)"),
        carrierId: z.number().int().positive().optional().describe("Filter by carrier ID"),
        includeChildCompanies: z.boolean().optional().describe("Include consignments from child companies"),
        includeDeletedConsignments: z.boolean().optional().describe("Include deleted consignments in results"),
        fromDateTimeLocal: z.string().optional().describe("Start date filter (local time ISO 8601)"),
        toDateTimeLocal: z.string().optional().describe("End date filter (local time ISO 8601)"),
        filterByEtaCompletedOrDespatch: z.string().optional().describe("Filter by ETA, completed, or despatch status")
      }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async (params) => {
      try {
        const data = await apiGet<unknown>("/apiv2/consignments/getAll", params);
        return successResponse(data);
      } catch (e) {
        return errorResponse(e);
      }
    }
  );

  server.registerTool(
    "machship_get_recent_consignments",
    {
      title: "Get Recently Created or Updated Consignments",
      description: `Returns consignments created or updated within a UTC date range. Ideal for sync/polling workflows.

Args:
  - companyId (number): Company ID
  - fromDateUtc (string): Start datetime in UTC (ISO 8601)
  - toDateUtc (string): End datetime in UTC (ISO 8601)
  - startIndex (number, optional): Pagination start index
  - retrieveSize (number, optional): Number to retrieve
  - carrierId (number, optional): Filter by carrier
  - includeChildCompanies (boolean, optional): Include sub-companies
  - getNotes (boolean, optional): Include notes in response
  - getReconciliationData (boolean, optional): Include reconciliation data`,
      inputSchema: z.object({
        companyId: z.number().int().positive().describe("Company ID"),
        fromDateUtc: z.string().describe("Start datetime UTC (ISO 8601)"),
        toDateUtc: z.string().describe("End datetime UTC (ISO 8601)"),
        startIndex: z.number().int().min(1).default(1).optional().describe("Pagination start index (default 1)"),
        retrieveSize: z.number().int().min(1).max(200).default(40).optional().describe("Number of results to return (default 40, max 200)"),
        carrierId: z.number().int().positive().optional().describe("Filter by carrier ID"),
        includeChildCompanies: z.boolean().optional().describe("Include consignments from child companies"),
        getNotes: z.boolean().optional().describe("Include notes in the response"),
        getReconciliationData: z.boolean().optional().describe("Include reconciliation data in the response")
      }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async (params) => {
      try {
        const data = await apiGet<unknown>("/apiv2/consignments/getRecentlyCreatedOrUpdatedConsignments", params);
        return successResponse(data);
      } catch (e) {
        return errorResponse(e);
      }
    }
  );

  server.registerTool(
    "machship_get_completed_consignments",
    {
      title: "Get Completed Consignments",
      description: `Returns completed (delivered) consignments within a date range (max 2000 results).

Args:
  - companyId (number): Company ID
  - startDate (string): Start date (ISO 8601)
  - endDate (string): End date (ISO 8601)
  - includeChildCompanies (boolean, optional): Include sub-companies`,
      inputSchema: z.object({
        companyId: z.number().int().positive().describe("Company ID"),
        startDate: z.string().describe("Start date (ISO 8601)"),
        endDate: z.string().describe("End date (ISO 8601)"),
        includeChildCompanies: z.boolean().optional().describe("Include consignments from child companies")
      }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async (params) => {
      try {
        const data = await apiGet<unknown>("/apiv2/consignments/getCompleted", params);
        return successResponse(data);
      } catch (e) {
        return errorResponse(e);
      }
    }
  );

  server.registerTool(
    "machship_create_consignment",
    {
      title: "Create Consignment",
      description: `Creates a new unmanifested consignment in Machship. This is the core operation for booking freight.

Args:
  - consignment (object): Full consignment details including:
    - companyId, fromCompanyLocationId, toAddress (suburb, postcode, state, country)
    - items (array of packages with weight, dimensions)
    - carrierId, serviceId, reference1, reference2, etc.`,
      inputSchema: z.object({
        consignment: z.record(z.unknown()).describe("Consignment data (companyId, from/to locations, items, carrier, service, references)")
      }).strict(),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true }
    },
    async ({ consignment }) => {
      try {
        const data = await apiPost<unknown>("/apiv2/consignments/createConsignment", consignment);
        return successResponse(data);
      } catch (e) {
        return errorResponse(e);
      }
    }
  );

  server.registerTool(
    "machship_create_consignment_with_complex_items",
    {
      title: "Create Consignment with Complex Items",
      description: `Creates a consignment using complex item definitions (with detailed packaging/dangerous goods data).

Args:
  - consignment (object): Consignment data with complexItems array instead of standard items`,
      inputSchema: z.object({
        consignment: z.record(z.unknown()).describe("Consignment data with complexItems array")
      }).strict(),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true }
    },
    async ({ consignment }) => {
      try {
        const data = await apiPost<unknown>("/apiv2/consignments/createConsignmentwithComplexItems", consignment);
        return successResponse(data);
      } catch (e) {
        return errorResponse(e);
      }
    }
  );

  server.registerTool(
    "machship_create_consignment_existing_items",
    {
      title: "Create Consignment with Existing Saved Items",
      description: `Creates a consignment using previously saved company items (by item ID / SKU).

Args:
  - consignment (object): Consignment data referencing existing saved item IDs`,
      inputSchema: z.object({
        consignment: z.record(z.unknown()).describe("Consignment data referencing existing item IDs")
      }).strict(),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true }
    },
    async ({ consignment }) => {
      try {
        const data = await apiPost<unknown>("/apiv2/consignments/createExistingConsignment", consignment);
        return successResponse(data);
      } catch (e) {
        return errorResponse(e);
      }
    }
  );

  server.registerTool(
    "machship_edit_consignment",
    {
      title: "Edit Unmanifested Consignment",
      description: `Edits an existing unmanifested (not yet booked) consignment. Cannot edit manifested consignments.

Args:
  - consignment (object): Updated consignment data including the consignment id`,
      inputSchema: z.object({
        consignment: z.record(z.unknown()).describe("Updated consignment data including id")
      }).strict(),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true }
    },
    async ({ consignment }) => {
      try {
        const data = await apiPost<unknown>("/apiv2/consignments/editUnmanifestedConsignment", consignment);
        return successResponse(data);
      } catch (e) {
        return errorResponse(e);
      }
    }
  );

  server.registerTool(
    "machship_delete_consignments",
    {
      title: "Delete Unmanifested Consignments",
      description: `Deletes multiple unmanifested consignments. Cannot delete manifested consignments.

Args:
  - ids (number[]): Array of consignment IDs to delete`,
      inputSchema: z.object({
        ids: z.array(z.number().int().positive()).min(1).describe("Consignment IDs to delete")
      }).strict(),
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: true }
    },
    async ({ ids }) => {
      try {
        const data = await apiPost<unknown>("/apiv2/consignments/deleteUnmanifestedConsignments", ids);
        return successResponse(data);
      } catch (e) {
        return errorResponse(e);
      }
    }
  );

  server.registerTool(
    "machship_search_consignments",
    {
      title: "Search Consignments",
      description: `Searches consignments by reference numbers (Reference 1, Reference 2, or carrier IDs).

Args:
  - references (string[]): Array of reference strings to search for`,
      inputSchema: z.object({
        references: z.array(z.string().min(1)).min(1).describe("Reference values to search")
      }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async ({ references }) => {
      try {
        const data = await apiPost<unknown>("/apiv2/consignments/searchConsignments", references);
        return successResponse(data);
      } catch (e) {
        return errorResponse(e);
      }
    }
  );

  server.registerTool(
    "machship_get_consignment_creation_settings",
    {
      title: "Get Consignment Creation Settings",
      description: `Returns settings and defaults needed for creating consignments for a company (required fields, defaults, etc.).

Args:
  - companyId (number, optional): Company ID (defaults to authenticated company)`,
      inputSchema: z.object({
        companyId: z.number().int().positive().optional().describe("Company ID (optional)")
      }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async ({ companyId }) => {
      try {
        const data = await apiGet<unknown>("/apiv2/consignments/getConsignmentCreationSettings", { companyId });
        return successResponse(data);
      } catch (e) {
        return errorResponse(e);
      }
    }
  );

  server.registerTool(
    "machship_get_consignment_attachments",
    {
      title: "Get Consignment Attachments",
      description: `Returns attachment metadata (not file contents) for a consignment.

Args:
  - consignmentId (number): Consignment ID`,
      inputSchema: z.object({
        consignmentId: z.number().int().positive().describe("Consignment ID")
      }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async ({ consignmentId }) => {
      try {
        const data = await apiPost<unknown>("/apiv2/consignments/getAttachments", undefined, { consignmentId });
        return successResponse(data);
      } catch (e) {
        return errorResponse(e);
      }
    }
  );

  server.registerTool(
    "machship_update_despatch_dates",
    {
      title: "Update Despatch Dates for Manifest",
      description: `Updates despatch dates and estimated time of arrival (ETA) for a set of consignments.

Args:
  - updates (array): Array of objects with consignmentId and new despatch date/ETA`,
      inputSchema: z.object({
        updates: z.array(z.record(z.unknown())).min(1).describe("Despatch date updates (consignmentId, despatchDate, eta)")
      }).strict(),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true }
    },
    async ({ updates }) => {
      try {
        const data = await apiPost<unknown>("/apiv2/consignments/updateDespatchDatesForManifest", updates);
        return successResponse(data);
      } catch (e) {
        return errorResponse(e);
      }
    }
  );

  server.registerTool(
    "machship_get_consignment_by_pending_id",
    {
      title: "Get Consignment by Pending Consignment ID",
      description: `Get consignment details (if it exists) using a pending consignment ID that has been transformed (linked) into a consignment.

Args:
  - id (number): Pending consignment ID`,
      inputSchema: z.object({
        id: z.number().int().positive().describe("Pending consignment ID")
      }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async ({ id }) => {
      try {
        const data = await apiGet<unknown>("/apiv2/consignments/getConsignmentByPendingConsignmentId", { id });
        return successResponse(data);
      } catch (e) {
        return errorResponse(e);
      }
    }
  );

  server.registerTool(
    "machship_get_consignment_for_clone",
    {
      title: "Get Consignment for Clone",
      description: `Get the details of an existing consignment in a format that can be passed directly to the createConsignmentWithComplexItems endpoint to create a copy.

Args:
  - id (number): Consignment ID to retrieve in clone format`,
      inputSchema: z.object({
        id: z.number().int().positive().describe("Consignment ID")
      }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async ({ id }) => {
      try {
        const data = await apiGet<unknown>("/apiv2/consignments/getConsignmentForClone", { id });
        return successResponse(data);
      } catch (e) {
        return errorResponse(e);
      }
    }
  );

  server.registerTool(
    "machship_get_unmanifested_consignment_for_edit",
    {
      title: "Get Unmanifested Consignment for Edit",
      description: `Get an unmanifested consignment in the same format required to perform an update via the editUnmanifestedConsignment endpoint.

Args:
  - id (number): Consignment ID (must be in unmanifested state)`,
      inputSchema: z.object({
        id: z.number().int().positive().describe("Consignment ID (must be unmanifested)")
      }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async ({ id }) => {
      try {
        const data = await apiGet<unknown>("/apiv2/consignments/getUnmanifestedConsignmentForEdit", { id });
        return successResponse(data);
      } catch (e) {
        return errorResponse(e);
      }
    }
  );

  server.registerTool(
    "machship_get_consignments_by_pending_ids",
    {
      title: "Get Consignments by Pending Consignment IDs (Batch)",
      description: `Get consignment details for multiple consignments using Pending Consignment IDs as the lookup. Maximum of 100 consignments per request.

Args:
  - ids (number[]): Array of pending consignment IDs (max 100)`,
      inputSchema: z.object({
        ids: z.array(z.number().int().positive()).min(1).max(100).describe("Pending consignment IDs (max 100)")
      }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async ({ ids }) => {
      try {
        const data = await apiPost<unknown>("/apiv2/consignments/returnConsignmentsByPendingConsignmentIds", { ids });
        return successResponse(data);
      } catch (e) {
        return errorResponse(e);
      }
    }
  );
}

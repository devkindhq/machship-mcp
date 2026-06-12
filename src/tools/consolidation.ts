import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { apiPost, errorResponse, successResponse } from "../client.js";

export function registerConsolidationTools(server: McpServer): void {
  server.registerTool(
    "machship_group_consignments_for_consolidation",
    {
      title: "Group Consignments for Consolidation",
      description: `Automatically groups consignments into consolidation groups based on options (carrier, route, etc.).
Returns groups without actually consolidating — preview step before consolidation.

Args:
  - options (object): Consolidation grouping options (companyId, carrierId, etc.)`,
      inputSchema: z.object({
        options: z.record(z.unknown()).describe("Consolidation grouping options")
      }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: false, openWorldHint: true }
    },
    async ({ options }) => {
      try {
        const data = await apiPost<unknown>("/apiv2/consolidation/groupConsignmentsForConsolidation", options);
        return successResponse(data);
      } catch (e) {
        return errorResponse(e);
      }
    }
  );

  server.registerTool(
    "machship_perform_consolidation",
    {
      title: "Perform Consolidation",
      description: `Consolidates a set of consignments into consolidated shipments.
This merges multiple consignments into fewer shipment units for carrier efficiency.

Args:
  - request (object): Consolidation request with consignment IDs and consolidation parameters`,
      inputSchema: z.object({
        request: z.record(z.unknown()).describe("Consolidation request payload")
      }).strict(),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true }
    },
    async ({ request }) => {
      try {
        const data = await apiPost<unknown>("/apiv2/consolidation/performConsolidation", request);
        return successResponse(data);
      } catch (e) {
        return errorResponse(e);
      }
    }
  );

  server.registerTool(
    "machship_group_and_perform_consolidation",
    {
      title: "Group and Perform Consolidation",
      description: `Groups and consolidates consignments in a single operation (combines grouping + performing).

Args:
  - options (object): Consolidation options (companyId, carrierId, grouping rules, etc.)`,
      inputSchema: z.object({
        options: z.record(z.unknown()).describe("Consolidation options")
      }).strict(),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true }
    },
    async ({ options }) => {
      try {
        const data = await apiPost<unknown>("/apiv2/consolidation/groupAndPerformConsolidation", options);
        return successResponse(data);
      } catch (e) {
        return errorResponse(e);
      }
    }
  );
}

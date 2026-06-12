import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { apiGet, apiPost, handleApiError, truncate } from "../client.js";

export function registerManifestsTools(server: McpServer): void {
  server.registerTool(
    "machship_get_manifests",
    {
      title: "Get Manifests",
      description: `Returns a paginated list of manifests for a company (max 200 per call).
A manifest represents a carrier pickup booking for a group of consignments.

Args:
  - companyId (number, optional): Company ID
  - startIndex (number, optional): Pagination start index (default 1)
  - retrieveSize (number, optional): Number to retrieve (default 40, max 200)
  - carrierId (number, optional): Filter by carrier
  - includeChildCompanies (boolean, optional): Include sub-companies
  - startDate (string, optional): Filter from date
  - endDate (string, optional): Filter to date`,
      inputSchema: z.object({
        companyId: z.number().int().positive().optional().describe("Company ID"),
        startIndex: z.number().int().min(1).default(1).optional(),
        retrieveSize: z.number().int().min(1).max(200).default(40).optional(),
        carrierId: z.number().int().positive().optional(),
        includeChildCompanies: z.boolean().optional(),
        startDate: z.string().optional().describe("Filter from date (ISO 8601)"),
        endDate: z.string().optional().describe("Filter to date (ISO 8601)")
      }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async (params) => {
      try {
        const data = await apiGet<unknown>("/apiv2/manifests/getAll", params);
        return { content: [{ type: "text" as const, text: truncate(JSON.stringify(data, null, 2)) }] };
      } catch (e) {
        return { content: [{ type: "text" as const, text: handleApiError(e) }] };
      }
    }
  );

  server.registerTool(
    "machship_group_all_for_manifest",
    {
      title: "Group All Unmanifested Consignments for Manifest",
      description: `Groups ALL unmanifested consignments for a company into manifest groups (preview before manifesting).

Args:
  - companyId (number): Company ID`,
      inputSchema: z.object({
        companyId: z.number().int().positive().describe("Company ID")
      }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: false, openWorldHint: true }
    },
    async ({ companyId }) => {
      try {
        const data = await apiPost<unknown>("/apiv2/manifests/groupAllUnmanifestedConsignmentsForManifest", companyId);
        return { content: [{ type: "text" as const, text: truncate(JSON.stringify(data, null, 2)) }] };
      } catch (e) {
        return { content: [{ type: "text" as const, text: handleApiError(e) }] };
      }
    }
  );

  server.registerTool(
    "machship_group_consignments_for_manifest",
    {
      title: "Group Consignments for Manifest",
      description: `Groups a specific set of consignments into manifest groups (preview before manifesting).

Args:
  - consignmentIds (number[]): Consignment IDs to group`,
      inputSchema: z.object({
        consignmentIds: z.array(z.number().int().positive()).min(1).describe("Consignment IDs to group")
      }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: false, openWorldHint: true }
    },
    async ({ consignmentIds }) => {
      try {
        const data = await apiPost<unknown>("/apiv2/manifests/groupConsignmentsForManifest", consignmentIds);
        return { content: [{ type: "text" as const, text: truncate(JSON.stringify(data, null, 2)) }] };
      } catch (e) {
        return { content: [{ type: "text" as const, text: handleApiError(e) }] };
      }
    }
  );

  server.registerTool(
    "machship_manifest_consignments",
    {
      title: "Manifest / Book Consignments with Carrier",
      description: `Books/manifests consignments with the carrier — creates the pickup booking and generates tracking numbers.
This is the final step in the consignment workflow before physical pickup.

Args:
  - manifests (array): Array of booked manifest objects with consignment IDs and carrier booking details`,
      inputSchema: z.object({
        manifests: z.array(z.record(z.unknown())).min(1).describe("Manifest booking objects (consignmentIds, carrierId, despatchDate, etc.)")
      }).strict(),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true }
    },
    async ({ manifests }) => {
      try {
        const data = await apiPost<unknown>("/apiv2/manifests/manifest", manifests);
        return { content: [{ type: "text" as const, text: truncate(JSON.stringify(data, null, 2)) }] };
      } catch (e) {
        return { content: [{ type: "text" as const, text: handleApiError(e) }] };
      }
    }
  );

  server.registerTool(
    "machship_rebook_manifest_pickup",
    {
      title: "Rebook Manifest Pickup",
      description: `Rebooks the carrier pickup for an existing manifest (e.g. missed pickup or changed schedule).

Args:
  - rebooking (object): Rebooking details including manifestId and new pickup datetime`,
      inputSchema: z.object({
        rebooking: z.record(z.unknown()).describe("Rebooking details (manifestId, pickupDate, etc.)")
      }).strict(),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true }
    },
    async ({ rebooking }) => {
      try {
        const data = await apiPost<unknown>("/apiv2/manifests/rebookPickup", rebooking);
        return { content: [{ type: "text" as const, text: truncate(JSON.stringify(data, null, 2)) }] };
      } catch (e) {
        return { content: [{ type: "text" as const, text: handleApiError(e) }] };
      }
    }
  );
}

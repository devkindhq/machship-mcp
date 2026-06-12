import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { apiGet, apiPost, handleApiError, truncate } from "../client.js";

export function registerLocationsTools(server: McpServer): void {
  server.registerTool(
    "machship_search_locations",
    {
      title: "Search Locations",
      description: `Returns up to 10 Machship locations matching a suburb or postcode search string.
Use this to look up valid delivery/pickup locations before creating consignments.

Args:
  - s (string): Search string — space-separated suburb/postcode (e.g. "Melbourne 3000")`,
      inputSchema: z.object({
        s: z.string().min(2).describe("Search string: suburb name, postcode, or both (e.g. 'Melbourne 3000')")
      }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async ({ s }) => {
      try {
        const data = await apiGet<unknown>("/apiv2/locations/getLocationsWithSearchOptions", { s });
        return { content: [{ type: "text" as const, text: truncate(JSON.stringify(data, null, 2)) }] };
      } catch (e) {
        return { content: [{ type: "text" as const, text: handleApiError(e) }] };
      }
    }
  );

  server.registerTool(
    "machship_get_locations_exact",
    {
      title: "Get Locations (Exact Match)",
      description: `Returns locations that exactly match provided suburb/postcode combinations.
Supports multiple location lookups in one call.

Args:
  - locations (array): Array of suburb/postcode pairs to look up exactly`,
      inputSchema: z.object({
        locations: z.array(z.object({
          suburb: z.string().describe("Suburb name"),
          postcode: z.string().describe("Postcode")
        })).min(1).describe("Suburb/postcode pairs for exact matching")
      }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async ({ locations }) => {
      try {
        const data = await apiPost<unknown>("/apiv2/locations/returnLocations", { locations });
        return { content: [{ type: "text" as const, text: truncate(JSON.stringify(data, null, 2)) }] };
      } catch (e) {
        return { content: [{ type: "text" as const, text: handleApiError(e) }] };
      }
    }
  );

  server.registerTool(
    "machship_get_locations_with_options",
    {
      title: "Get Locations with Search Options",
      description: `Returns locations with additional search options/filters applied.

Args:
  - s (string): Search string
  - options (object): Additional search options (country, state, etc.)`,
      inputSchema: z.object({
        s: z.string().min(1).describe("Search string"),
        options: z.record(z.unknown()).optional().describe("Additional location search options")
      }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async ({ s, options }) => {
      try {
        const data = await apiPost<unknown>("/apiv2/locations/returnLocationsWithSearchOptions", options ?? {}, { s });
        return { content: [{ type: "text" as const, text: truncate(JSON.stringify(data, null, 2)) }] };
      } catch (e) {
        return { content: [{ type: "text" as const, text: handleApiError(e) }] };
      }
    }
  );
}

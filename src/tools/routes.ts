import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { apiPost, handleApiError, truncate } from "../client.js";

export function registerRoutesTools(server: McpServer): void {
  server.registerTool(
    "machship_get_routes",
    {
      title: "Get Available Routes",
      description: `Returns a list of available freight routes and carrier services for a single shipment request.
Use this to find all carrier options (rates, ETAs) before creating a consignment.

Args:
  - request (object): Route request including:
    - companyId: Company ID
    - fromSuburb, fromPostcode, fromState, fromCountry: Origin location
    - toSuburb, toPostcode, toState, toCountry: Destination location
    - items: Array of packages with weight (kg), length/width/height (cm)
    - despatchDate (optional): Planned despatch date`,
      inputSchema: z.object({
        request: z.record(z.unknown()).describe("Route request (companyId, from/to location, items with weight/dimensions, optional despatchDate)")
      }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: false, openWorldHint: true }
    },
    async ({ request }) => {
      try {
        const data = await apiPost<unknown>("/apiv2/routes/returnroutes", request);
        return { content: [{ type: "text" as const, text: truncate(JSON.stringify(data, null, 2)) }] };
      } catch (e) {
        return { content: [{ type: "text" as const, text: handleApiError(e) }] };
      }
    }
  );

  server.registerTool(
    "machship_get_routes_batch",
    {
      title: "Get Available Routes (Batch)",
      description: `Returns available routes for multiple shipment requests in a single call.
Efficient for bulk rate shopping across multiple shipments.

Args:
  - requests (array): Array of route request objects (same structure as single route request)`,
      inputSchema: z.object({
        requests: z.array(z.record(z.unknown())).min(1).describe("Array of route requests")
      }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: false, openWorldHint: true }
    },
    async ({ requests }) => {
      try {
        const data = await apiPost<unknown>("/apiv2/routes/returnmultipleroutes", requests);
        return { content: [{ type: "text" as const, text: truncate(JSON.stringify(data, null, 2)) }] };
      } catch (e) {
        return { content: [{ type: "text" as const, text: handleApiError(e) }] };
      }
    }
  );

  server.registerTool(
    "machship_get_routes_complex_items",
    {
      title: "Get Available Routes with Complex Items",
      description: `Returns available routes for a shipment with complex item definitions (dangerous goods, specialised packaging).

Args:
  - request (object): Route request with complexItems array (including dangerous goods classifications)`,
      inputSchema: z.object({
        request: z.record(z.unknown()).describe("Route request with complexItems (dangerous goods, specialised packaging)")
      }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: false, openWorldHint: true }
    },
    async ({ request }) => {
      try {
        const data = await apiPost<unknown>("/apiv2/routes/returnrouteswithcomplexitems", request);
        return { content: [{ type: "text" as const, text: truncate(JSON.stringify(data, null, 2)) }] };
      } catch (e) {
        return { content: [{ type: "text" as const, text: handleApiError(e) }] };
      }
    }
  );
}

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { apiGet, apiPost, handleApiError, truncate } from "../client.js";

export function registerQuotesTools(server: McpServer): void {
  server.registerTool(
    "machship_create_quote",
    {
      title: "Create Quote",
      description: `Creates a freight quote in Machship — returns available carrier rates for a shipment.
Use this to compare carrier prices before creating a consignment.

Args:
  - quote (object): Quote request including companyId, fromAddress/locationId, toAddress, items (weight, dimensions), and optionally carrierId/serviceId to filter`,
      inputSchema: z.object({
        quote: z.record(z.unknown()).describe("Quote request (companyId, fromAddress, toAddress, items with weight/dimensions)")
      }).strict(),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true }
    },
    async ({ quote }) => {
      try {
        const data = await apiPost<unknown>("/apiv2/quotes/createQuote", quote);
        return { content: [{ type: "text" as const, text: truncate(JSON.stringify(data, null, 2)) }] };
      } catch (e) {
        return { content: [{ type: "text" as const, text: handleApiError(e) }] };
      }
    }
  );

  server.registerTool(
    "machship_create_quote_complex_items",
    {
      title: "Create Quote with Complex Items",
      description: `Creates a freight quote using complex item definitions (with detailed packaging/dangerous goods data).

Args:
  - quote (object): Quote request with complexItems array instead of standard items`,
      inputSchema: z.object({
        quote: z.record(z.unknown()).describe("Quote request with complexItems array")
      }).strict(),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true }
    },
    async ({ quote }) => {
      try {
        const data = await apiPost<unknown>("/apiv2/quotes/createQuoteWithComplexItems", quote);
        return { content: [{ type: "text" as const, text: truncate(JSON.stringify(data, null, 2)) }] };
      } catch (e) {
        return { content: [{ type: "text" as const, text: handleApiError(e) }] };
      }
    }
  );

  server.registerTool(
    "machship_get_quotes",
    {
      title: "Get All Quotes",
      description: `Returns all quotes for a given company.

Args:
  - companyId (number): Company ID`,
      inputSchema: z.object({
        companyId: z.number().int().positive().describe("Company ID")
      }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async ({ companyId }) => {
      try {
        const data = await apiGet<unknown>("/apiv2/quotes/getAll", { companyId });
        return { content: [{ type: "text" as const, text: truncate(JSON.stringify(data, null, 2)) }] };
      } catch (e) {
        return { content: [{ type: "text" as const, text: handleApiError(e) }] };
      }
    }
  );

  server.registerTool(
    "machship_get_quote",
    {
      title: "Get Quote",
      description: `Returns details for a single quote by ID.

Args:
  - id (number): Quote ID`,
      inputSchema: z.object({
        id: z.number().int().positive().describe("Quote ID")
      }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async ({ id }) => {
      try {
        const data = await apiGet<unknown>("/apiv2/quotes/getQuote", { id });
        return { content: [{ type: "text" as const, text: truncate(JSON.stringify(data, null, 2)) }] };
      } catch (e) {
        return { content: [{ type: "text" as const, text: handleApiError(e) }] };
      }
    }
  );
}

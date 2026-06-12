import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { apiGet, apiPost, errorResponse, successResponse, ResponseFormat } from "../client.js";

export function registerQuotesTools(server: McpServer): void {
  server.registerTool(
    "machship_create_quote",
    {
      title: "Create Quote",
      description: `Creates a freight quote in Machship — returns available carrier rates for a shipment.
Use this to compare carrier prices and transit times before creating a consignment.

Args:
  - quote (object): Quote request including:
    - companyId (number): Company to quote under
    - fromAddress or fromLocationId: Pickup address or location ID
    - toAddress: Delivery address (suburb, postcode, state, country)
    - items: Array of items with weight (kg), length/width/height (cm)
    - carrierId / serviceId (optional): Filter to a specific carrier/service

Returns:
  Array of available rate options, each with:
  { "carrierId", "serviceName", "totalCost", "transitDays", "accountId" }

Examples:
  - Use when: "Get freight quotes from Sydney to Melbourne for a 5kg parcel"
  - Don't use when: You already have a carrier in mind — use machship_create_consignment directly`,
      inputSchema: z.object({
        quote: z.record(z.unknown())
          .describe("Quote request body (companyId, fromAddress/fromLocationId, toAddress, items)")
      }).strict(),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true }
    },
    async ({ quote }) => {
      try {
        const data = await apiPost<unknown>("/apiv2/quotes/createQuote", quote);
        return successResponse(data);
      } catch (e) {
        return errorResponse(e);
      }
    }
  );

  server.registerTool(
    "machship_create_quote_complex_items",
    {
      title: "Create Quote with Complex Items",
      description: `Creates a freight quote using complex item definitions (detailed packaging, dangerous goods, serialisation data).

Args:
  - quote (object): Quote request with complexItems array instead of standard items

Returns: Same as machship_create_quote — array of rate options with cost and transit info.

Examples:
  - Use when: Items have dangerous goods codes, serial numbers, or non-standard packaging
  - Use when: machship_create_quote returned a validation error about item structure`,
      inputSchema: z.object({
        quote: z.record(z.unknown()).describe("Quote request with complexItems array")
      }).strict(),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true }
    },
    async ({ quote }) => {
      try {
        const data = await apiPost<unknown>("/apiv2/quotes/createQuoteWithComplexItems", quote);
        return successResponse(data);
      } catch (e) {
        return errorResponse(e);
      }
    }
  );

  server.registerTool(
    "machship_get_quotes",
    {
      title: "Get All Quotes",
      description: `Returns all quotes for a given company.

Args:
  - companyId (number): Company ID
  - response_format ('json' | 'markdown'): Output format (default: 'json')

Returns:
  Array of quote summary objects:
  { "id": number, "reference": string, "status": string, "createdDate": string }

Examples:
  - Use when: "List all quotes for company 123"
  - Use when: You need a quote ID to pass to machship_get_quote for full details
  - Don't use when: You want to create a new quote (use machship_create_quote instead)

Error Handling:
  - Error 404: companyId does not exist or is not accessible`,
      inputSchema: z.object({
        companyId: z.number().int().positive().describe("Company ID"),
        response_format: z.enum(["json", "markdown"]).default("json")
          .describe("Output format: 'json' (default) or 'markdown'")
      }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async ({ companyId, response_format }) => {
      try {
        const data = await apiGet<unknown>("/apiv2/quotes/getAll", { companyId });
        return successResponse(data, response_format as ResponseFormat);
      } catch (e) {
        return errorResponse(e);
      }
    }
  );

  server.registerTool(
    "machship_get_quote",
    {
      title: "Get Quote",
      description: `Returns full details for a single quote by ID, including all carrier rate options.

Args:
  - id (number): Quote ID
  - response_format ('json' | 'markdown'): Output format (default: 'json')

Returns:
  Full quote object with all carrier rate options, addresses, and item details.

Examples:
  - Use when: "Show me the full details for quote 456"
  - Use when: You have a quote ID and need the carrier rates to pick one for a consignment`,
      inputSchema: z.object({
        id: z.number().int().positive().describe("Quote ID"),
        response_format: z.enum(["json", "markdown"]).default("json")
          .describe("Output format: 'json' (default) or 'markdown'")
      }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async ({ id, response_format }) => {
      try {
        const data = await apiGet<unknown>("/apiv2/quotes/getQuote", { id });
        return successResponse(data, response_format as ResponseFormat);
      } catch (e) {
        return errorResponse(e);
      }
    }
  );
}

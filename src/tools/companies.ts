import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { apiGet, errorResponse, successResponse, ResponseFormat } from "../client.js";

export function registerCompaniesTools(server: McpServer): void {
  server.registerTool(
    "machship_get_companies",
    {
      title: "Get Companies",
      description: `Returns all companies accessible to the authenticated user.

Args:
  - atOrBelowCompanyId (number, optional): Filter to companies at or below this company in the hierarchy
  - response_format ('json' | 'markdown'): Output format (default: 'json')

Returns:
  Array of company objects, each containing:
  {
    "id": number,           // Company ID — use this in other tool calls
    "name": string,         // Display name of the company
    "isActive": boolean,    // Whether the company is active
    "parentCompanyId": number | null
  }

Examples:
  - Use when: "List all companies I have access to"
  - Use when: "What company ID does Acme Corp have?" -> call this, then search by name
  - Don't use when: You need carrier/service info (use machship_get_company_carriers instead)

Error Handling:
  - Error 401: Check MACHSHIP_API_TOKEN is set correctly
  - Error 403: Token lacks permission to list companies`,
      inputSchema: z.object({
        atOrBelowCompanyId: z.number().int().positive().optional()
          .describe("Limit to companies at or below this company ID in the hierarchy"),
        response_format: z.enum(["json", "markdown"]).default("json")
          .describe("Output format: 'json' (machine-readable, default) or 'markdown' (human-readable)")
      }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async ({ atOrBelowCompanyId, response_format }) => {
      try {
        const data = await apiGet<unknown>("/apiv2/companies/getAll", { atOrBelowCompanyId });
        return successResponse(data, response_format as ResponseFormat);
      } catch (e) {
        return errorResponse(e);
      }
    }
  );

  server.registerTool(
    "machship_get_company_carriers",
    {
      title: "Get Company Carriers, Accounts and Services",
      description: `Returns all available carriers, carrier accounts, and freight services for a company.
Call this before creating consignments or quotes to discover which services and accounts are available.

Args:
  - companyId (number): Company ID
  - response_format ('json' | 'markdown'): Output format (default: 'json')

Returns:
  Array of carrier objects with nested accounts and services, each containing:
  {
    "carrierId": number,
    "carrierName": string,
    "accounts": [
      {
        "accountId": number,
        "accountName": string,
        "services": [{ "serviceId": number, "serviceName": string }]
      }
    ]
  }

Examples:
  - Use when: "What carriers are available for company 123?"
  - Use when: You need a serviceId to pass to createConsignment
  - Don't use when: You just need a company list (use machship_get_companies instead)`,
      inputSchema: z.object({
        companyId: z.number().int().positive().describe("Company ID"),
        response_format: z.enum(["json", "markdown"]).default("json")
          .describe("Output format: 'json' (default) or 'markdown'")
      }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async ({ companyId, response_format }) => {
      try {
        const data = await apiGet<unknown>("/apiv2/companies/getAvailableCarriersAccountsAndServices", { companyId });
        return successResponse(data, response_format as ResponseFormat);
      } catch (e) {
        return errorResponse(e);
      }
    }
  );
}

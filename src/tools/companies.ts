import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { apiGet, handleApiError, truncate } from "../client.js";

export function registerCompaniesTools(server: McpServer): void {
  server.registerTool(
    "machship_get_companies",
    {
      title: "Get Companies",
      description: `Returns all companies accessible to the authenticated user.

Args:
  - atOrBelowCompanyId (number, optional): Limit results to companies at or below this company in the hierarchy`,
      inputSchema: z.object({
        atOrBelowCompanyId: z.number().int().positive().optional().describe("Company hierarchy filter")
      }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async ({ atOrBelowCompanyId }) => {
      try {
        const data = await apiGet<unknown>("/apiv2/companies/getAll", { atOrBelowCompanyId });
        return { content: [{ type: "text" as const, text: truncate(JSON.stringify(data, null, 2)) }] };
      } catch (e) {
        return { content: [{ type: "text" as const, text: handleApiError(e) }] };
      }
    }
  );

  server.registerTool(
    "machship_get_company_carriers",
    {
      title: "Get Company Carriers, Accounts and Services",
      description: `Returns all available carriers, carrier accounts, and freight services for a company.
Essential before creating consignments or quotes to know which services are available.

Args:
  - companyId (number): The company ID to get carriers for`,
      inputSchema: z.object({
        companyId: z.number().int().positive().describe("Company ID")
      }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async ({ companyId }) => {
      try {
        const data = await apiGet<unknown>("/apiv2/companies/getAvailableCarriersAccountsAndServices", { companyId });
        return { content: [{ type: "text" as const, text: truncate(JSON.stringify(data, null, 2)) }] };
      } catch (e) {
        return { content: [{ type: "text" as const, text: handleApiError(e) }] };
      }
    }
  );
}

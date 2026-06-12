import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { apiGet, errorResponse, successResponse } from "../client.js";

export function registerIdentityProvidersTools(server: McpServer): void {
  server.registerTool(
    "machship_get_identity_provider",
    {
      title: "Get Identity Provider",
      description: `Get a specific identity provider by ID.

Args:
  - identityProviderId (number): Identity provider ID`,
      inputSchema: z.object({
        identityProviderId: z.number().int().positive().describe("Identity provider ID")
      }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async ({ identityProviderId }) => {
      try {
        const data = await apiGet<unknown>("/apiv2/identityproviders/GetIdentityProvider", { identityProviderId });
        return successResponse(data);
      } catch (e) {
        return errorResponse(e);
      }
    }
  );

  server.registerTool(
    "machship_get_identity_providers_for_company",
    {
      title: "Get Identity Providers for Company",
      description: `Get all identity providers associated with a specific company.

Args:
  - companyId (number): Company ID`,
      inputSchema: z.object({
        companyId: z.number().int().positive().describe("Company ID")
      }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async ({ companyId }) => {
      try {
        const data = await apiGet<unknown>("/apiv2/identityproviders/GetIdentityProvidersForCompany", { companyId });
        return successResponse(data);
      } catch (e) {
        return errorResponse(e);
      }
    }
  );

  server.registerTool(
    "machship_get_identity_providers_for_logged_user",
    {
      title: "Get Identity Providers for Logged-in User",
      description: `Returns all identity providers for the current user's organisation. No parameters required.`,
      inputSchema: z.object({}).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async () => {
      try {
        const data = await apiGet<unknown>("/apiv2/identityproviders/GetIdentityProvidersForLoggedUser", {});
        return successResponse(data);
      } catch (e) {
        return errorResponse(e);
      }
    }
  );

  server.registerTool(
    "machship_get_identity_providers_for_organisation",
    {
      title: "Get Identity Providers for Organisation",
      description: `Returns all identity providers for the specified organisation.

Args:
  - organisationId (number): Organisation ID`,
      inputSchema: z.object({
        organisationId: z.number().int().positive().describe("Organisation ID")
      }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async ({ organisationId }) => {
      try {
        const data = await apiGet<unknown>("/apiv2/identityproviders/GetIdentityProvidersForOrganisation", { organisationId });
        return successResponse(data);
      } catch (e) {
        return errorResponse(e);
      }
    }
  );
}

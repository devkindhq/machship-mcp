import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { apiGet, apiPost, errorResponse, successResponse } from "../client.js";

export function registerIdentitiesTools(server: McpServer): void {
  server.registerTool(
    "machship_get_identities",
    {
      title: "Get Identities",
      description: `Get all identities owned by an organisation, with details on which companies they are linked to.
Requires administrator access to the organisation.

Args:
  - organisationId (number): Organisation ID
  - onlyUnlinkedIdentities (boolean, optional): Return only identities not linked to any company
  - identityProviderId (number, optional): Filter by identity provider`,
      inputSchema: z.object({
        organisationId: z.number().int().positive().describe("Organisation ID"),
        onlyUnlinkedIdentities: z.boolean().optional().describe("Return only unlinked identities"),
        identityProviderId: z.number().int().positive().optional().describe("Filter by identity provider ID")
      }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async (params) => {
      try {
        const data = await apiGet<unknown>("/apiv2/identities/getIdentities", params);
        return successResponse(data);
      } catch (e) {
        return errorResponse(e);
      }
    }
  );

  server.registerTool(
    "machship_get_identity",
    {
      title: "Get Identity",
      description: `Get the identity with the given ID.

Args:
  - id (number): Identity ID`,
      inputSchema: z.object({
        id: z.number().int().positive().describe("Identity ID")
      }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async ({ id }) => {
      try {
        const data = await apiGet<unknown>("/apiv2/identities/getIdentity", { id });
        return successResponse(data);
      } catch (e) {
        return errorResponse(e);
      }
    }
  );

  server.registerTool(
    "machship_get_available_roles",
    {
      title: "Get Available Roles",
      description: `Get all roles that are available to assign to users of a certain company.

Args:
  - companyId (number): Company ID`,
      inputSchema: z.object({
        companyId: z.number().int().positive().describe("Company ID")
      }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async ({ companyId }) => {
      try {
        const data = await apiGet<unknown>("/apiv2/identities/getAvailableRoles", { companyId });
        return successResponse(data);
      } catch (e) {
        return errorResponse(e);
      }
    }
  );

  server.registerTool(
    "machship_create_identities",
    {
      title: "Create Identities",
      description: `Create identities in MachShip and assign companies and roles. All identities must belong to the same identityProvider and organisation.
Requires administrator access.

Args:
  - identities (array): Array of identity objects, each with:
    - givenName (string): First name (required)
    - familyName (string): Last name (required)
    - displayName (string): Display name (required)
    - emailAddress (string): Email (required)
    - identifyingClaim (string): Unique claim for identity provider (required)
    - organisationId (number): Organisation ID (required)
    - identityProviderId (number): Identity provider ID (required)
    - owningCompanyId (number): Owning company ID (required)
    - password (string, optional): Password
    - uniqueId (string, optional): Unique ID
    - userAndCompanyLinks (array, optional): Company/role links to create`,
      inputSchema: z.object({
        identities: z.array(z.object({
          givenName: z.string().min(1).describe("First name"),
          familyName: z.string().min(1).describe("Last name"),
          displayName: z.string().min(1).describe("Display name"),
          emailAddress: z.string().email().describe("Email address"),
          identifyingClaim: z.string().min(1).describe("Unique claim for identity provider"),
          organisationId: z.number().int().positive().describe("Organisation ID"),
          identityProviderId: z.number().int().positive().describe("Identity provider ID"),
          owningCompanyId: z.number().int().positive().describe("Owning company ID"),
          uniqueId: z.string().optional().describe("Unique ID"),
          password: z.string().optional().describe("Password"),
          phone: z.string().optional().describe("Phone number"),
          businessPhone: z.string().optional().describe("Business phone number"),
          mobile: z.string().optional().describe("Mobile number"),
          position: z.string().optional().describe("Job position or title"),
          notes: z.string().optional().describe("Additional notes about the identity"),
          enableEmailNotifications: z.boolean().optional().describe("Enable email notifications for this identity"),
          userAndCompanyLinks: z.array(z.record(z.unknown())).optional().describe("Company/role links")
        })).min(1).describe("Identities to create")
      }).strict(),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true }
    },
    async ({ identities }) => {
      try {
        const data = await apiPost<unknown>("/apiv2/identities/createIdentities", identities);
        return successResponse(data);
      } catch (e) {
        return errorResponse(e);
      }
    }
  );

  server.registerTool(
    "machship_update_identity",
    {
      title: "Update Identity",
      description: `Updates properties on an identity. All fields except password are required; omitted fields are set to null.

Args:
  - id (number): Identity ID (required)
  - givenName (string): First name (required)
  - familyName (string): Last name (required)
  - displayName (string): Display name (required)
  - emailAddress (string): Email address (required)
  - owningCompanyId (number): Owning company ID (required)
  - password (string, optional): New password
  - phone / businessPhone / mobile / position / notes (optional)`,
      inputSchema: z.object({
        id: z.number().int().positive().describe("Identity ID"),
        givenName: z.string().min(1).describe("First name"),
        familyName: z.string().min(1).describe("Last name"),
        displayName: z.string().min(1).describe("Display name"),
        emailAddress: z.string().email().describe("Email address"),
        owningCompanyId: z.number().int().positive().describe("Owning company ID"),
        password: z.string().optional().describe("New password (optional)"),
        phone: z.string().optional().describe("Phone number"),
        businessPhone: z.string().optional().describe("Business phone number"),
        mobile: z.string().optional().describe("Mobile number"),
        position: z.string().optional().describe("Job position or title"),
        notes: z.string().optional().describe("Additional notes about the identity")
      }).strict(),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true }
    },
    async (params) => {
      try {
        const data = await apiPost<unknown>("/apiv2/identities/updateIdentity", params);
        return successResponse(data);
      } catch (e) {
        return errorResponse(e);
      }
    }
  );

  server.registerTool(
    "machship_delete_identities",
    {
      title: "Delete Identities",
      description: `Delete the identities with the given IDs. This action is irreversible.

Args:
  - ids (number[]): Array of identity IDs to delete`,
      inputSchema: z.object({
        ids: z.array(z.number().int().positive()).min(1).describe("Identity IDs to delete")
      }).strict(),
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: true }
    },
    async ({ ids }) => {
      try {
        const data = await apiPost<unknown>("/apiv2/identities/deleteIdentities", ids);
        return successResponse(data);
      } catch (e) {
        return errorResponse(e);
      }
    }
  );

  server.registerTool(
    "machship_disable_identities",
    {
      title: "Disable Identities",
      description: `Disable the identities with the given IDs, preventing them from logging in.

Args:
  - ids (number[]): Array of identity IDs to disable`,
      inputSchema: z.object({
        ids: z.array(z.number().int().positive()).min(1).describe("Identity IDs to disable")
      }).strict(),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true }
    },
    async ({ ids }) => {
      try {
        const data = await apiPost<unknown>("/apiv2/identities/disableIdentities", ids);
        return successResponse(data);
      } catch (e) {
        return errorResponse(e);
      }
    }
  );

  server.registerTool(
    "machship_reenable_identities",
    {
      title: "Re-enable Identities",
      description: `Re-enable previously disabled identities, restoring login access.

Args:
  - ids (number[]): Array of identity IDs to re-enable`,
      inputSchema: z.object({
        ids: z.array(z.number().int().positive()).min(1).describe("Identity IDs to re-enable")
      }).strict(),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true }
    },
    async ({ ids }) => {
      try {
        const data = await apiPost<unknown>("/apiv2/identities/reenableIdentities", ids);
        return successResponse(data);
      } catch (e) {
        return errorResponse(e);
      }
    }
  );

  server.registerTool(
    "machship_link_identities_to_companies",
    {
      title: "Link Identities to Companies",
      description: `Assign companies and roles to identities to give them access to the system.
Requires administrator access.

Args:
  - links (array): Array of identity-company link objects, each with identityId, companyId, and roles`,
      inputSchema: z.object({
        links: z.array(z.object({
          identityId: z.number().int().positive().describe("Identity ID"),
          companyId: z.number().int().positive().describe("Company ID"),
          roles: z.array(z.record(z.unknown())).optional().describe("Roles to assign")
        })).min(1).describe("Identity-company links to create")
      }).strict(),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true }
    },
    async ({ links }) => {
      try {
        const data = await apiPost<unknown>("/apiv2/identities/linkIdentitiesToCompanies", { links });
        return successResponse(data);
      } catch (e) {
        return errorResponse(e);
      }
    }
  );

  server.registerTool(
    "machship_unlink_identities_from_companies",
    {
      title: "Unlink Identities from Companies",
      description: `Remove company access from identities. Each entry specifies an identity and the company to revoke access from.

Args:
  - unlinks (array): Array of objects with identityId and companyId to unlink`,
      inputSchema: z.object({
        unlinks: z.array(z.object({
          identityId: z.number().int().positive().describe("Identity ID"),
          companyId: z.number().int().positive().describe("Company ID to remove access from")
        })).min(1).describe("Identity-company pairs to unlink")
      }).strict(),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true }
    },
    async ({ unlinks }) => {
      try {
        const data = await apiPost<unknown>("/apiv2/identities/unlinkIdentitiesFromCompanies", unlinks);
        return successResponse(data);
      } catch (e) {
        return errorResponse(e);
      }
    }
  );

  server.registerTool(
    "machship_return_identity_public_keys",
    {
      title: "Return Identity Public Keys",
      description: `Get the public keys of the supplied identities. These keys can be used by a linked organisation to grant
those identities access to companies in their organisation.
Requires administrator access.

Args:
  - ids (number[]): Array of identity IDs to retrieve public keys for`,
      inputSchema: z.object({
        ids: z.array(z.number().int().positive()).min(1).describe("Identity IDs")
      }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async ({ ids }) => {
      try {
        const data = await apiPost<unknown>("/apiv2/identities/returnIdentityPublicKeys", ids);
        return successResponse(data);
      } catch (e) {
        return errorResponse(e);
      }
    }
  );
}

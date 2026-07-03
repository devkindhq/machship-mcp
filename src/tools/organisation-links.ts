import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { apiGet, apiPost, errorResponse, successResponse } from "../client.js";

export function registerOrganisationLinksTools(server: McpServer): void {
  server.registerTool(
    "machship_get_organisation_links",
    {
      title: "Get Organisation Links",
      description: `Returns all links (partnerships/integrations) that exist for an organisation.

Args:
  - id (number, optional): Organisation ID (leave blank for current authenticated org)`,
      inputSchema: z.object({
        id: z.number().int().positive().optional().describe("Organisation ID (optional, defaults to current org)")
      }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async ({ id }) => {
      try {
        const data = await apiGet<unknown>("/apiv2/organisationLinks/getForOrganisation", { id });
        return successResponse(data);
      } catch (e) {
        return errorResponse(e);
      }
    }
  );

  server.registerTool(
    "machship_get_linked_from_organisations",
    {
      title: "Get Linked-From Organisations",
      description: `Returns all organisations that have linked INTO this organisation (suppliers, partners).

Args:
  - startIndex (number, optional): Pagination start index
  - retrieveSize (number, optional): Number to retrieve
  - sort (string, optional): Sort field
  - searchText (string, optional): Filter by name`,
      inputSchema: z.object({
        startIndex: z.number().int().min(1).optional().describe("Pagination start index"),
        retrieveSize: z.number().int().min(1).max(100).optional().describe("Number of results to return (max 100)"),
        sort: z.string().optional().describe("Sort field name"),
        searchText: z.string().optional().describe("Filter results by organisation name")
      }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async (params) => {
      try {
        const data = await apiGet<unknown>("/apiv2/organisationLinks/getLinkedFromOrganisations", params);
        return successResponse(data);
      } catch (e) {
        return errorResponse(e);
      }
    }
  );

  server.registerTool(
    "machship_get_linked_to_organisations",
    {
      title: "Get Linked-To Organisations",
      description: `Returns all organisations this organisation has linked TO (customers, subsidiaries).

Args:
  - startIndex (number, optional): Pagination start index
  - retrieveSize (number, optional): Number to retrieve
  - sort (string, optional): Sort field
  - searchText (string, optional): Filter by name`,
      inputSchema: z.object({
        startIndex: z.number().int().min(1).optional().describe("Pagination start index"),
        retrieveSize: z.number().int().min(1).max(100).optional().describe("Number of results to return (max 100)"),
        sort: z.string().optional().describe("Sort field name"),
        searchText: z.string().optional().describe("Filter results by organisation name")
      }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async (params) => {
      try {
        const data = await apiGet<unknown>("/apiv2/organisationLinks/getLinkedToOrganisations", params);
        return successResponse(data);
      } catch (e) {
        return errorResponse(e);
      }
    }
  );

  server.registerTool(
    "machship_get_organisation_public_key",
    {
      title: "Get Organisation Public Key",
      description: `Returns the public key for an organisation, used to set up inter-organisation links.

Args:
  - id (number, optional): Organisation ID (defaults to current org)`,
      inputSchema: z.object({
        id: z.number().int().positive().optional().describe("Organisation ID (optional)")
      }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async ({ id }) => {
      try {
        const data = await apiGet<unknown>("/apiv2/organisationLinks/getPublicKeyForOrganisation", { id });
        return successResponse(data);
      } catch (e) {
        return errorResponse(e);
      }
    }
  );

  server.registerTool(
    "machship_get_organisation_by_public_key",
    {
      title: "Get Organisation Details by Public Key",
      description: `Validates a public key and returns the corresponding organisation details.
Use this to verify a partner's public key before linking.

Args:
  - publicKey (string): Organisation public key to look up`,
      inputSchema: z.object({
        publicKey: z.string().min(1).describe("Organisation public key")
      }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async ({ publicKey }) => {
      try {
        const data = await apiGet<unknown>("/apiv2/organisationLinks/getOrganisationDetailsByPublicKey", { publicKey });
        return successResponse(data);
      } catch (e) {
        return errorResponse(e);
      }
    }
  );

  server.registerTool(
    "machship_add_organisation_link",
    {
      title: "Add Organisation Link",
      description: `Links another organisation into yours using their public key.

Args:
  - request (object): Link request with the partner's publicKey and optional configuration`,
      inputSchema: z.object({
        request: z.record(z.unknown()).describe("Link request (publicKey of partner organisation)")
      }).strict(),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true }
    },
    async ({ request }) => {
      try {
        const data = await apiPost<unknown>("/apiv2/organisationLinks/add", request);
        return successResponse(data);
      } catch (e) {
        return errorResponse(e);
      }
    }
  );

  server.registerTool(
    "machship_remove_organisation_link",
    {
      title: "Remove Organisation Link",
      description: `Removes an existing link between two organisations. This action is irreversible.

Args:
  - request (object): Unlink request with organisationLinkId to remove`,
      inputSchema: z.object({
        request: z.record(z.unknown()).describe("Unlink request (organisationLinkId)")
      }).strict(),
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: true }
    },
    async ({ request }) => {
      try {
        const data = await apiPost<unknown>("/apiv2/organisationLinks/remove", request);
        return successResponse(data);
      } catch (e) {
        return errorResponse(e);
      }
    }
  );

  server.registerTool(
    "machship_reset_organisation_public_key",
    {
      title: "Reset Organisation Public Key",
      description: `Resets the public key for an organisation (generates new key). Does NOT affect existing links.

Args:
  - id (number, optional): Organisation ID (defaults to current org)`,
      inputSchema: z.object({
        id: z.number().int().positive().optional().describe("Organisation ID (optional)")
      }).strict(),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true }
    },
    async ({ id }) => {
      try {
        const data = await apiGet<unknown>("/apiv2/organisationLinks/resetPublicKeyForOrganisation", { id });
        return successResponse(data);
      } catch (e) {
        return errorResponse(e);
      }
    }
  );
}

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { apiGet, apiPost, errorResponse, successResponse } from "../client.js";

export function registerCompanyLocationsTools(server: McpServer): void {
  server.registerTool(
    "machship_get_company_location",
    {
      title: "Get Company Location",
      description: `Returns details for a single company location (warehouse, store, depot).

Args:
  - id (number): Company location ID`,
      inputSchema: z.object({
        id: z.number().int().positive().describe("Company location ID")
      }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async ({ id }) => {
      try {
        const data = await apiGet<unknown>("/apiv2/companyLocations/get", { id });
        return successResponse(data);
      } catch (e) {
        return errorResponse(e);
      }
    }
  );

  server.registerTool(
    "machship_get_company_locations",
    {
      title: "Get All Company Locations",
      description: `Returns all locations (warehouses, stores, depots) for a given company.

Args:
  - companyId (number): Company ID`,
      inputSchema: z.object({
        companyId: z.number().int().positive().describe("Company ID")
      }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async ({ companyId }) => {
      try {
        const data = await apiGet<unknown>("/apiv2/companyLocations/getAll", { companyId });
        return successResponse(data);
      } catch (e) {
        return errorResponse(e);
      }
    }
  );

  server.registerTool(
    "machship_create_company_location",
    {
      title: "Create Company Location",
      description: `Creates a new company location (warehouse, store, depot pickup point).

Args:
  - location (object): Location data including companyId, name, address, suburb, postcode, state, country, contactName, phone, etc.`,
      inputSchema: z.object({
        location: z.record(z.unknown()).describe("Location data (companyId, name, address, suburb, postcode, state, country, contactName, phone)")
      }).strict(),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true }
    },
    async ({ location }) => {
      try {
        const data = await apiPost<unknown>("/apiv2/companyLocations/create", location);
        return successResponse(data);
      } catch (e) {
        return errorResponse(e);
      }
    }
  );

  server.registerTool(
    "machship_edit_company_location",
    {
      title: "Edit Company Location",
      description: `Edits an existing company location.

Args:
  - location (object): Updated location data including id and any fields to update`,
      inputSchema: z.object({
        location: z.record(z.unknown()).describe("Updated location data including id")
      }).strict(),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true }
    },
    async ({ location }) => {
      try {
        const data = await apiPost<unknown>("/apiv2/companyLocations/edit", location);
        return successResponse(data);
      } catch (e) {
        return errorResponse(e);
      }
    }
  );

  server.registerTool(
    "machship_get_permanent_pickups",
    {
      title: "Get Permanent Pickups for Company Location",
      description: `Gets all permanent scheduled pickups configured for a company location.

Args:
  - companyLocationId (number): Company location ID`,
      inputSchema: z.object({
        companyLocationId: z.number().int().positive().describe("Company location ID")
      }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async ({ companyLocationId }) => {
      try {
        const data = await apiGet<unknown>("/apiv2/companyLocations/getPermanentPickupsForCompanyLocation", { companyLocationId });
        return successResponse(data);
      } catch (e) {
        return errorResponse(e);
      }
    }
  );

  server.registerTool(
    "machship_add_permanent_pickups",
    {
      title: "Add Permanent Pickups to Company Location",
      description: `Adds permanent scheduled pickups to a company location.

Args:
  - payload (object): Contains companyLocationId and pickup schedule details`,
      inputSchema: z.object({
        payload: z.record(z.unknown()).describe("Permanent pickup configuration including companyLocationId and schedule")
      }).strict(),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true }
    },
    async ({ payload }) => {
      try {
        const data = await apiPost<unknown>("/apiv2/companyLocations/addPermanentPickupsToCompanyLocation", payload);
        return successResponse(data);
      } catch (e) {
        return errorResponse(e);
      }
    }
  );
}

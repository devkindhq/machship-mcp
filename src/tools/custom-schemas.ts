import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { apiGet, apiPost, errorResponse, successResponse } from "../client.js";

export function registerCustomSchemasTools(server: McpServer): void {
  server.registerTool(
    "machship_get_custom_schemas",
    {
      title: "Get All Custom Schemas",
      description: `Returns all custom schemas defined in the Machship organisation.
Custom schemas extend Machship entities with additional fields.`,
      inputSchema: z.object({}).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async () => {
      try {
        const data = await apiGet<unknown>("/api/customSchemas/getAll");
        return successResponse(data);
      } catch (e) {
        return errorResponse(e);
      }
    }
  );

  server.registerTool(
    "machship_get_custom_schema",
    {
      title: "Get Custom Schema by ID",
      description: `Returns a specific custom schema by its DotNet class ID.

Args:
  - id (string): The DotNet class ID of the schema`,
      inputSchema: z.object({
        id: z.string().min(1).describe("DotNet class ID of the schema")
      }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async ({ id }) => {
      try {
        const data = await apiGet<unknown>("/api/customSchemas/getByDotNetClassId", { id });
        return successResponse(data);
      } catch (e) {
        return errorResponse(e);
      }
    }
  );

  server.registerTool(
    "machship_create_custom_schema",
    {
      title: "Create Custom Schema",
      description: `Creates a new custom schema to extend Machship entities with additional fields.

Args:
  - name (string): Schema name
  - type (string): Schema type/entity to extend
  - schema (object): JSON schema definition`,
      inputSchema: z.object({
        name: z.string().min(1).describe("Schema name"),
        type: z.string().min(1).describe("Schema type/entity"),
        schema: z.record(z.unknown()).describe("JSON schema definition")
      }).strict(),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true }
    },
    async ({ name, type, schema }) => {
      try {
        const data = await apiPost<unknown>("/api/customSchemas/create", schema, { name, type });
        return successResponse(data);
      } catch (e) {
        return errorResponse(e);
      }
    }
  );

  server.registerTool(
    "machship_update_custom_schema",
    {
      title: "Update Custom Schema",
      description: `Updates an existing custom schema by its DotNet class ID.

Args:
  - id (string): DotNet class ID of the schema to update
  - schema (object): Updated JSON schema definition`,
      inputSchema: z.object({
        id: z.string().min(1).describe("DotNet class ID"),
        schema: z.record(z.unknown()).describe("Updated JSON schema definition")
      }).strict(),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true }
    },
    async ({ id, schema }) => {
      try {
        const data = await apiPost<unknown>("/api/customSchemas/updateByDotNetClassId", schema, { id });
        return successResponse(data);
      } catch (e) {
        return errorResponse(e);
      }
    }
  );

  server.registerTool(
    "machship_delete_custom_schema",
    {
      title: "Delete Custom Schema",
      description: `Deletes a custom schema by its DotNet class ID. This is irreversible.

Args:
  - id (string): DotNet class ID of the schema to delete`,
      inputSchema: z.object({
        id: z.string().min(1).describe("DotNet class ID")
      }).strict(),
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: true }
    },
    async ({ id }) => {
      try {
        const data = await apiPost<unknown>("/api/customSchemas/deleteByDotNetClassId", undefined, { id });
        return successResponse(data);
      } catch (e) {
        return errorResponse(e);
      }
    }
  );
}

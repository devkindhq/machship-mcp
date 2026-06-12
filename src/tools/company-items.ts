import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { apiGet, apiPost, apiDelete, errorResponse, successResponse } from "../client.js";

export function registerCompanyItemsTools(server: McpServer): void {
  server.registerTool(
    "machship_get_item",
    {
      title: "Get Company Item",
      description: `Returns a single saved item (product/SKU) with its dimensions by ID.

Args:
  - id (number): Item ID`,
      inputSchema: z.object({
        id: z.number().int().positive().describe("Item ID")
      }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async ({ id }) => {
      try {
        const data = await apiGet<unknown>("/apiv2/items/get", { id });
        return successResponse(data);
      } catch (e) {
        return errorResponse(e);
      }
    }
  );

  server.registerTool(
    "machship_get_items",
    {
      title: "Get All Company Items",
      description: `Returns a paginated list of saved items for a company (max 200 per request).

Args:
  - companyId (number): Company ID
  - startIndex (number, optional): Pagination start index (default 1)
  - retrieveSize (number, optional): Number of items to retrieve (default 200, max 200)`,
      inputSchema: z.object({
        companyId: z.number().int().positive().describe("Company ID"),
        startIndex: z.number().int().min(1).default(1).describe("Pagination start index"),
        retrieveSize: z.number().int().min(1).max(200).default(200).describe("Items to retrieve (max 200)")
      }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async (params) => {
      try {
        const data = await apiGet<unknown>("/apiv2/items/getAll", params);
        return successResponse(data);
      } catch (e) {
        return errorResponse(e);
      }
    }
  );

  server.registerTool(
    "machship_get_item_by_sku",
    {
      title: "Get Company Item by SKU",
      description: `Returns a saved item matching the given SKU for a company.

Args:
  - companyId (number): Company ID
  - sku (string): Product SKU code`,
      inputSchema: z.object({
        companyId: z.number().int().positive().describe("Company ID"),
        sku: z.string().min(1).describe("Product SKU")
      }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async ({ companyId, sku }) => {
      try {
        const data = await apiGet<unknown>("/apiv2/items/getBySku", { companyId, sku });
        return successResponse(data);
      } catch (e) {
        return errorResponse(e);
      }
    }
  );

  server.registerTool(
    "machship_get_item_complex",
    {
      title: "Get Complex Company Item",
      description: `Returns a single complex item (with detailed dimensions/packaging data) by ID.

Args:
  - id (number): Item ID`,
      inputSchema: z.object({
        id: z.number().int().positive().describe("Item ID")
      }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async ({ id }) => {
      try {
        const data = await apiGet<unknown>("/apiv2/items/getComplex", { id });
        return successResponse(data);
      } catch (e) {
        return errorResponse(e);
      }
    }
  );

  server.registerTool(
    "machship_get_items_complex",
    {
      title: "Get All Complex Company Items",
      description: `Returns a paginated list of complex items for a company (max 200 per request).

Args:
  - companyId (number): Company ID
  - startIndex (number, optional): Pagination start index (default 1)
  - retrieveSize (number, optional): Number of items to retrieve (default 200, max 200)`,
      inputSchema: z.object({
        companyId: z.number().int().positive().describe("Company ID"),
        startIndex: z.number().int().min(1).default(1).describe("Pagination start index"),
        retrieveSize: z.number().int().min(1).max(200).default(200).describe("Items to retrieve (max 200)")
      }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async (params) => {
      try {
        const data = await apiGet<unknown>("/apiv2/items/getAllComplex", params);
        return successResponse(data);
      } catch (e) {
        return errorResponse(e);
      }
    }
  );

  server.registerTool(
    "machship_get_item_complex_by_sku",
    {
      title: "Get Complex Company Item by SKU",
      description: `Returns a complex item (detailed dimensions) by SKU for a company.

Args:
  - companyId (number): Company ID
  - sku (string): Product SKU code`,
      inputSchema: z.object({
        companyId: z.number().int().positive().describe("Company ID"),
        sku: z.string().min(1).describe("Product SKU")
      }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async ({ companyId, sku }) => {
      try {
        const data = await apiGet<unknown>("/apiv2/items/getBySkuComplex", { companyId, sku });
        return successResponse(data);
      } catch (e) {
        return errorResponse(e);
      }
    }
  );

  server.registerTool(
    "machship_create_item_complex",
    {
      title: "Create Complex Company Item",
      description: `Creates a new complex item (product/SKU with detailed packaging info) for a company.

Args:
  - companyId (number): Company ID to create item under
  - item (object): Item details including sku, description, weight, dimensions, etc.`,
      inputSchema: z.object({
        companyId: z.number().int().positive().describe("Company ID"),
        item: z.record(z.unknown()).describe("Complex item data (sku, description, weight, length, width, height, etc.)")
      }).strict(),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true }
    },
    async ({ companyId, item }) => {
      try {
        const data = await apiPost<unknown>("/apiv2/items/createComplex", item, { companyId });
        return successResponse(data);
      } catch (e) {
        return errorResponse(e);
      }
    }
  );

  server.registerTool(
    "machship_delete_item",
    {
      title: "Delete Company Item",
      description: `Deletes a saved item from a company. This action is irreversible.

Args:
  - companyItemId (number): The ID of the item to delete`,
      inputSchema: z.object({
        companyItemId: z.number().int().positive().describe("Company item ID to delete")
      }).strict(),
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: true }
    },
    async ({ companyItemId }) => {
      try {
        const data = await apiDelete<unknown>("/apiv2/items/delete", { companyItemId });
        return successResponse(data);
      } catch (e) {
        return errorResponse(e);
      }
    }
  );

  server.registerTool(
    "machship_get_items_by_skus",
    {
      title: "Get Company Items by SKUs (Batch)",
      description: `Returns a list of saved items matching any of the supplied SKUs (standard items only, max 100 SKUs).
SKUs that don't match any item are silently omitted — compare returned Sku values against your input to detect misses.

Args:
  - companyId (number): Company ID
  - skus (string[]): Array of SKU codes to look up (max 100)`,
      inputSchema: z.object({
        companyId: z.number().int().positive().describe("Company ID"),
        skus: z.array(z.string().min(1)).min(1).max(100).describe("SKU codes to look up (max 100)")
      }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async ({ companyId, skus }) => {
      try {
        const data = await apiPost<unknown>("/apiv2/items/getBySkus", skus, { companyId });
        return successResponse(data);
      } catch (e) {
        return errorResponse(e);
      }
    }
  );
}

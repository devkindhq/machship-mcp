import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { apiGet, handleApiError, truncate } from "../client.js";

export function registerNotesTools(server: McpServer): void {
  server.registerTool(
    "machship_get_consignment_notes",
    {
      title: "Get Consignment Notes",
      description: `Returns all notes attached to a consignment (internal comments, delivery instructions, etc.).

Args:
  - id (number): Consignment ID`,
      inputSchema: z.object({
        id: z.number().int().positive().describe("Consignment ID")
      }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async ({ id }) => {
      try {
        const data = await apiGet<unknown>("/apiv2/notes/getNotesForConsignment", { id });
        return { content: [{ type: "text" as const, text: truncate(JSON.stringify(data, null, 2)) }] };
      } catch (e) {
        return { content: [{ type: "text" as const, text: handleApiError(e) }] };
      }
    }
  );
}

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { apiPost, handleApiError, truncate } from "../client.js";

export function registerAuthenticateTools(server: McpServer): void {
  server.registerTool(
    "machship_ping",
    {
      title: "Ping / Check Auth Status",
      description: `Determines the current user's login status and retrieves session properties from Machship.
Use this to verify authentication is working and to get the current user/company context.

Returns: session info including user details, company ID, and permissions.`,
      inputSchema: z.object({}).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async () => {
      try {
        const data = await apiPost<unknown>("/apiv2/authenticate/ping");
        return { content: [{ type: "text" as const, text: truncate(JSON.stringify(data, null, 2)) }] };
      } catch (e) {
        return { content: [{ type: "text" as const, text: handleApiError(e) }] };
      }
    }
  );
}

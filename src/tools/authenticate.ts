import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { apiPost, errorResponse, successResponse } from "../client.js";

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
        return successResponse(data);
      } catch (e) {
        return errorResponse(e);
      }
    }
  );
}

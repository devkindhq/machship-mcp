#!/usr/bin/env node
/**
 * Machship MCP Server
 *
 * MCP server for the Machship freight/fulfillment platform API.
 * Covers: Attachments, Authenticate, CarrierInvoices, CommercialInvoices,
 * Companies, CompanyItems, CompanyLocations, Consignments, Consolidation,
 * CustomSchemas, FinancialInvoice, Identities, IdentityProviders, Labels,
 * Locations, Manifests, Notes, OrganisationLinks, PendingConsignments, Quotes, Routes
 *
 * Compatible with: Claude, OpenAI, Gemini, Cursor, and any MCP-compliant client.
 *
 * Required env vars:
 *   MACHSHIP_API_TOKEN  — Bearer token from Machship
 *   MACHSHIP_API_URL    — (optional) Override API base URL, default: https://live.machship.com
 *   TRANSPORT           — (optional) "http" for streamable HTTP, default: stdio
 *   PORT                — (optional) HTTP port when TRANSPORT=http, default: 3000
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { VERSION, SERVER_NAME } from "./utils/constants.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express from "express";

import { registerAuthenticateTools } from "./tools/authenticate.js";
import { registerAttachmentsTools } from "./tools/attachments.js";
import { registerCarrierInvoicesTools } from "./tools/carrier-invoices.js";
import { registerCommercialInvoicesTools } from "./tools/commercial-invoices.js";
import { registerCompaniesTools } from "./tools/companies.js";
import { registerCompanyItemsTools } from "./tools/company-items.js";
import { registerCompanyLocationsTools } from "./tools/company-locations.js";
import { registerConsignmentsTools } from "./tools/consignments.js";
import { registerConsolidationTools } from "./tools/consolidation.js";
import { registerCustomSchemasTools } from "./tools/custom-schemas.js";
import { registerFinancialInvoicesTools } from "./tools/financial-invoices.js";
import { registerIdentitiesTools } from "./tools/identities.js";
import { registerIdentityProvidersTools } from "./tools/identity-providers.js";
import { registerLabelsTools } from "./tools/labels.js";
import { registerLocationsTools } from "./tools/locations.js";
import { registerManifestsTools } from "./tools/manifests.js";
import { registerNotesTools } from "./tools/notes.js";
import { registerOrganisationLinksTools } from "./tools/organisation-links.js";
import { registerPendingConsignmentsTools } from "./tools/pending-consignments.js";
import { registerQuotesTools } from "./tools/quotes.js";
import { registerRoutesTools } from "./tools/routes.js";

function createServer(): McpServer {
  const server = new McpServer({
    name: SERVER_NAME,
    version: VERSION,
  });

  registerAuthenticateTools(server);
  registerAttachmentsTools(server);
  registerCarrierInvoicesTools(server);
  registerCommercialInvoicesTools(server);
  registerCompaniesTools(server);
  registerCompanyItemsTools(server);
  registerCompanyLocationsTools(server);
  registerConsignmentsTools(server);
  registerConsolidationTools(server);
  registerCustomSchemasTools(server);
  registerFinancialInvoicesTools(server);
  registerIdentitiesTools(server);
  registerIdentityProvidersTools(server);
  registerLabelsTools(server);
  registerLocationsTools(server);
  registerManifestsTools(server);
  registerNotesTools(server);
  registerOrganisationLinksTools(server);
  registerPendingConsignmentsTools(server);
  registerQuotesTools(server);
  registerRoutesTools(server);

  return server;
}

async function runStdio(): Promise<void> {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Machship MCP server running via stdio");
}

async function runHTTP(): Promise<void> {
  const app = express();
  app.use(express.json());

  app.post("/mcp", async (req, res) => {
    const server = createServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true
    });
    res.on("close", () => transport.close());
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  });

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", server: "machship-mcp-server" });
  });

  const port = parseInt(process.env.PORT || "3000");
  app.listen(port, () => {
    console.error(`Machship MCP server running on http://localhost:${port}/mcp`);
  });
}

const transport = process.env.TRANSPORT || "stdio";
if (transport === "http") {
  runHTTP().catch((error: unknown) => {
    console.error("Server error:", error);
    process.exit(1);
  });
} else {
  runStdio().catch((error: unknown) => {
    console.error("Server error:", error);
    process.exit(1);
  });
}

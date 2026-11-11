# CODEBASE.md — MachShip MCP Server Guide

Operational guide and reference for AI agents maintaining, extending, or consuming the `@devkind/machship-mcp` Model Context Protocol server.

---

## 1. Environment & Architecture

### Identity & Runtime
- **Package:** `@devkind/machship-mcp` (runtime Node.js >= 22, ESM, TypeScript target `ES2022`). Development needs Node.js 22.14+ or 24.10+: semantic-release 25 declares that engine range and Yarn 1 enforces it on `yarn install`.
- **MCP Framework:** High-level `McpServer` from `@modelcontextprotocol/sdk/server/mcp.js` (SDK `^1.32.1`).
- **Catalog Tool Count:** 125 tools across 21 domain modules in `src/tools/`.
- **Server Name & Version:** `machship-mcp` / `1.0.0` defined in `src/utils/constants.ts`.

### Transports
Transport mode is chosen via `TRANSPORT`:
- `TRANSPORT=stdio` (default): `StdioServerTransport`. Process lifetime tied to parent process stdin/stdout.
  - **Standard Stream Boundary:** All server logs, errors, and diagnostic messages write strictly to `stderr` (`console.error`). Standard out (`stdout`) is reserved exclusively for JSON-RPC messages.
- `TRANSPORT=http`: the SDK's `createMcpExpressApp({ host })` on `MCP_HOST` (default `127.0.0.1`) and `PORT` (default `3000`). For `127.0.0.1`, `localhost` or `::1` the SDK rejects other `Host` headers with 403 (DNS rebinding protection). Any other host disables that check; the SDK prints a warning only for `0.0.0.0` and `::`. The Dockerfile sets `MCP_HOST=0.0.0.0`.
  - **Security:** no authentication. Every request uses the server's own token, so a non-local `MCP_HOST` needs an authenticating proxy.
  - Endpoint `POST /mcp`: Handled via `StreamableHTTPServerTransport` with `enableJsonResponse: true`. Instantiates a new `McpServer` and transport instance per connection.
  - Endpoint `GET /health`: Healthcheck responding with `{ "status": "ok", "server": "machship-mcp-server" }`.

### Configuration Variables
| Variable | Default | Purpose |
| :--- | :--- | :--- |
| `MACHSHIP_API_TOKEN` | *None (Required for tool calls)* | MachShip API token, sent in the `token` header. Deferred verification allows metadata listing without a token. Optional in the MCPB `user_config` (Smithery "Optional config" check); `requireToken()` in `src/client.ts` returns a clear error on each call without it. |
| `MACHSHIP_API_URL` | `https://live.machship.com` | Base API URL. Target `https://sandbox-api.machship.com` for testing. *Never use `MACHSHIP_BASE_URL` (ignored).* |
| `TRANSPORT` | `stdio` | `stdio` or `http`. |
| `PORT` | `3000` | HTTP listening port when `TRANSPORT=http`. |
| `MCP_HOST` | `127.0.0.1` | HTTP bind address when `TRANSPORT=http`. |

---

## 2. API Client & Communication Contracts

### Request Handling (`src/client.ts`)
- **Transport Client:** Axios instance with hardcoded 30-second timeout (`timeout: 30000`).
- **Standard Authentication Header:**
  ```json
  { "token": "<MACHSHIP_API_TOKEN>" }
  ```
  *Quirk:* `src/client.ts` sends `"token": token`. Do not send `Authorization: Bearer <token>` through `client.ts`. (Exception: `src/tools/commercial-invoices.ts` directly uses Bearer auth).
- **HTTP Methods:** Exposes `apiGet`, `apiPost`, and `apiDelete`. (No `apiPut` or `apiPatch`; updates use POST).

### Response Wrapping & Truncation
- Responses return `McpToolResult`:
  ```ts
  {
    content: [{ type: "text", text: string }],
    structuredContent: Record<string, unknown>
  }
  ```
- **Text Truncation Barrier:** Output text in `content[0].text` is hard-capped at 25,000 characters (`CHARACTER_LIMIT = 25000` in `src/constants.ts`). Oversized text is sliced and suffixed with `\n\n[TRUNCATED: response exceeded 25000 characters. Use pagination or narrower filters.]`.
- **Data Integrity:** `structuredContent` contains the full, untruncated JavaScript object. Extract deep responses and binary data from `structuredContent`.
- **MachShip Response Envelope:** MachShip REST responses wrap outcomes in `{ object: <payload>, errors: <validation_errors>[] }`. `apiGet` and `apiPost` return the whole envelope as `response.data`. An HTTP 200 response with business errors inside `response.data.errors` is treated as a success by the client wrapper. Inspect `data.errors` when handling complex mutations.

### Error Handling Codes
- `400`: Invalid parameters, missing required fields, or ill-formed types.
- `401`: Missing or invalid `MACHSHIP_API_TOKEN`.
- `403`: Insufficient permission for company, identity, or resource.
- `404`: Entity ID not found or inaccessible.
- `429`: Rate limit exceeded. Server returns immediate error; client must wait before retrying.
- `500`: MachShip internal server error.
- `ECONNABORTED`: Operation exceeded 30-second timeout. Occurs on large PDF generation or deep unmanifested consignment searches. Narrow the date window or paginate.

---

## 3. Tool Authoring Standards & Conventions

Every tool registered in `src/tools/` complies with `STYLE_GUIDE.md`:

```ts
server.registerTool(
  "machship_<verb>_<noun>",
  {
    title: "Human Readable Action",
    description: "Imperative verb summary sentence.\n\nArgs:\n  - argName (type): Details and constraints.",
    inputSchema: z.object({
      companyId: z.number().int().positive().describe("Company identifier"),
      includeDeleted: z.boolean().optional().describe("Include soft-deleted records")
    }).strict(),
    outputSchema: resultSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true
    }
  },
  async (params) => {
    try {
      const data = await apiGet<unknown>("/apiv2/...", params);
      return successResponse(data);
    } catch (e) {
      return errorResponse(e);
    }
  }
);
```

### Invariants:
1. **Tool Naming:** Always `machship_<verb>_<noun>` in snake_case (e.g., `machship_get_consignment`, `machship_create_quote`).
2. **Strict Schemas:** Always terminate Zod schemas with `.strict()`. Extra arguments passed by clients trigger immediate validation failure.
3. **Identifier Suffixes:** Always use `Id`, `Key`, or `Slug` in camelCase (`companyId`, `consignmentId`, `carrierId`).
4. **Boolean Naming:** Prefix booleans with verbs (`includeChildCompanies`, `printA4`, `returnPdfFileBytes`).
5. **Arrays:** Use plural identifiers (`ids`, `references`, `files`, `skus`).
6. **Annotations:** Set `readOnlyHint: true` on queries, `destructiveHint: true` on deletions.
7. **Tool Naming stays snake_case:** Smithery's "Naming" check rewards dot notation (`machship.get_x`), but several clients only accept `[a-zA-Z0-9_-]` and a rename breaks existing connections. Keep the names; that check stays unmet on purpose.
8. **Output Schema:** Always set `outputSchema: resultSchema` (from `src/client.ts`) and return through `successResponse` / `errorResponse`. The SDK validates every successful result against the output schema, so `successResponse` always returns an object: the Machship envelope `{ object, errors }` as-is, any other payload (arrays, file bytes) as `{ object }`. Smithery's quality score counts output schemas per tool.

---

## 4. Master Domain Workflows & Lifecycle

### Freight Lifecycle Sequence

```
[1. Pricing & Route Discovery]
  ├── machship_get_routes / machship_get_routes_batch (Stateless real-time rates)
  └── machship_create_quote / machship_create_quote_complex_items (Persisted Quote record)

[2. Drafting & Staging (Optional)]
  └── machship_create_pending_consignment (Draft unassigned staging record)
        └── Lookup converted consignment via machship_get_consignment_by_pending_id

[3. Consignment Creation (Unmanifested)]
  ├── machship_create_consignment (Standard packaging)
  ├── machship_create_consignment_with_complex_items (Pallets, sub-items, dangerous goods)
  ├── machship_create_consignment_existing_items (Saved catalog SKUs)
  ├── machship_edit_consignment (Allowed ONLY while unmanifested)
  └── machship_delete_consignments (Allowed ONLY while unmanifested)

[4. Labelling & Consolidation]
  ├── machship_group_consignments_for_consolidation / machship_perform_consolidation
  ├── Labels PDF / ZIP: machship_get_item_label_pdf, machship_return_item_pdfs_for_consignments
  └── Hardware Printing: machship_group_consignments_for_printing -> machship_send_labels_to_printer

[5. Carrier Manifesting & Booking]
  ├── Preview: machship_group_all_for_manifest / machship_group_consignments_for_manifest
  ├── Execution: machship_manifest_consignments (EDI dispatch to carrier, pickup booking)
  └── Exception handling: machship_rebook_manifest_pickup

[6. Active Transit & Delivery Tracking]
  ├── Tracking: machship_get_consignment_statuses / machship_get_consignments_by_carrier_id
  ├── Status Updates: machship_update_consignment_statuses
  ├── Attachments & POD: machship_get_consignment_attachments -> machship_get_attachment_pod_report
  └── Historical: machship_get_completed_consignments / machship_get_recent_consignments

[7. Invoice Audit & Reconciliation]
  ├── Carrier Invoices: machship_get_carrier_invoices -> machship_get_carrier_invoice_entries
  ├── Auto-Reconcile: machship_attempt_auto_reconciliation
  ├── Discrepancy Repricing: machship_update_reprice_consignment
  └── Customer Billing: machship_get_posted_invoices / machship_get_invoice_by_document_number
```

---

## 5. Domain Modules & Tool Reference Catalog

### 5.1 Authenticate (`src/tools/authenticate.ts`)
| Tool | HTTP Method | Endpoint | Description |
| :--- | :--- | :--- | :--- |
| `machship_ping` | `POST` | `/apiv2/authenticate/ping` | Liveness check; validates token and returns active session identity, company ID, and permissions. |

### 5.2 Companies & Organization Hierarchy (`src/tools/companies.ts`)
| Tool | HTTP Method | Endpoint | Description |
| :--- | :--- | :--- | :--- |
| `machship_get_companies` | `GET` | `/apiv2/companies/getAll` | Lists companies accessible to user. Supports `atOrBelowCompanyId` filter. |
| `machship_get_company_carriers` | `GET` | `/apiv2/companies/getAvailableCarriersAccountsAndServices` | Returns carriers, accounts, and service IDs configured for a given `companyId`. |

### 5.3 Locations & Directory (`src/tools/locations.ts`)
| Tool | HTTP Method | Endpoint | Description |
| :--- | :--- | :--- | :--- |
| `machship_search_locations` | `GET` | `/apiv2/locations/getLocationsWithSearchOptions` | Fuzzy prefix search across suburb/postcode directory. Requires minimum 2 characters. Returns top 10. |
| `machship_get_locations_exact` | `POST` | `/apiv2/locations/returnLocations` | Resolves exact suburb and postcode pairs to system `locationId` values. |
| `machship_get_locations_with_options` | `POST` | `/apiv2/locations/returnLocationsWithSearchOptions` | Filtered directory lookup with state and country options. |

### 5.4 Company Locations & Scheduled Pickups (`src/tools/company-locations.ts`)
| Tool | HTTP Method | Endpoint | Description |
| :--- | :--- | :--- | :--- |
| `machship_get_company_location` | `GET` | `/apiv2/companyLocations/get` | Retrieves saved warehouse/facility by location ID. |
| `machship_get_company_locations` | `GET` | `/apiv2/companyLocations/getAll` | Returns all saved locations for a company. |
| `machship_create_company_location` | `POST` | `/apiv2/companyLocations/create` | Adds a permanent depot/store location. |
| `machship_edit_company_location` | `POST` | `/apiv2/companyLocations/edit` | Updates existing saved facility. |
| `machship_get_permanent_pickups` | `GET` | `/apiv2/companyLocations/getPermanentPickupsForCompanyLocation` | Lists scheduled recurring carrier pickups for a facility. |
| `machship_add_permanent_pickups` | `POST` | `/apiv2/companyLocations/addPermanentPickupsToCompanyLocation` | Attaches recurring carrier pickup schedules to a location. |

### 5.5 Company Items & Catalog (`src/tools/company-items.ts`)
| Tool | HTTP Method | Endpoint | Description |
| :--- | :--- | :--- | :--- |
| `machship_get_item` | `GET` | `/apiv2/items/get` | Retrieves saved standard item by ID. |
| `machship_get_items` | `GET` | `/apiv2/items/getAll` | Paginated listing of standard items (max 200 per page). |
| `machship_get_item_by_sku` | `GET` | `/apiv2/items/getBySku` | Fetches standard item by exact SKU string. |
| `machship_get_item_complex` | `GET` | `/apiv2/items/getComplex` | Retrieves complex item with multi-tier packaging. |
| `machship_get_items_complex` | `GET` | `/apiv2/items/getAllComplex` | Paginated listing of complex items (max 200 per page). |
| `machship_get_item_complex_by_sku` | `GET` | `/apiv2/items/getBySkuComplex` | Fetches complex item by SKU. |
| `machship_create_item_complex` | `POST` | `/apiv2/items/createComplex` | Saves a complex item with packaging and DG specs. |
| `machship_delete_item` | `DELETE` | `/apiv2/items/delete` | Deletes a catalog item by `companyItemId`. |
| `machship_get_items_by_skus` | `POST` | `/apiv2/items/getBySkus` | Batch lookup for up to 100 SKUs. *Unmatched SKUs are silently omitted.* |

### 5.6 Routing Engine (`src/tools/routes.ts`)
| Tool | HTTP Method | Endpoint | Description |
| :--- | :--- | :--- | :--- |
| `machship_get_routes` | `POST` | `/apiv2/routes/returnroutes` | Stateless single shipment route/rate calculation. |
| `machship_get_routes_batch` | `POST` | `/apiv2/routes/returnmultipleroutes` | Evaluates routes for multiple shipments in one request. |
| `machship_get_routes_complex_items` | `POST` | `/apiv2/routes/returnrouteswithcomplexitems` | Route calculation factoring in complex packaging and DG. |

### 5.7 Quotes (`src/tools/quotes.ts`)
| Tool | HTTP Method | Endpoint | Description |
| :--- | :--- | :--- | :--- |
| `machship_create_quote` | `POST` | `/apiv2/quotes/createQuote` | Calculates and persists freight quote record. |
| `machship_create_quote_complex_items` | `POST` | `/apiv2/quotes/createQuoteWithComplexItems` | Persists quote with complex packaging and DG. |
| `machship_get_quotes` | `GET` | `/apiv2/quotes/getAll` | Lists historical quotes for a company. |
| `machship_get_quote` | `GET` | `/apiv2/quotes/getQuote` | Retrieves full quote breakdown by quote ID. |

### 5.8 Pending Consignments / Staging (`src/tools/pending-consignments.ts`)
| Tool | HTTP Method | Endpoint | Description |
| :--- | :--- | :--- | :--- |
| `machship_create_pending_consignment` | `POST` | `/apiv2/pendingConsignments/createPendingConsignment` | Stages an unassigned draft shipment. |
| `machship_get_pending_consignment` | `GET` | `/apiv2/pendingConsignments/getPendingConsignment` | Retrieves pending consignment by ID. |
| `machship_get_pending_consignments_by_ids` | `POST` | `/apiv2/pendingConsignments/returnPendingConsignments` | Batch retrieves up to 10 pending consignments. Body: `{ ids: [...] }`. |
| `machship_get_pending_consignments_by_reference1` | `POST` | `/apiv2/pendingConsignments/returnPendingConsignmentsByReference1` | Finds pending consignments by PO/order reference (max 10). Body: `[...]`. |
| `machship_get_pending_consignments_by_reference2` | `POST` | `/apiv2/pendingConsignments/returnPendingConsignmentsByReference2` | Finds pending consignments by secondary reference (max 10). Body: `[...]`. |
| `machship_get_recent_pending_consignments` | `GET` | `/apiv2/pendingConsignments/getRecentlyCreatedOrUpdatedPendingConsignments` | Polling endpoint by UTC change window. |
| `machship_delete_pending_consignments` | `POST` | `/apiv2/pendingConsignments/deletePendingConsignments` | Deletes pending draft shipments. Body: `[...]`. |

### 5.9 Consignments (`src/tools/consignments.ts`)
| Tool | HTTP Method | Endpoint | Description |
| :--- | :--- | :--- | :--- |
| `machship_get_consignment` | `GET` | `/apiv2/consignments/getConsignment` | Full consignment details by ID. |
| `machship_get_consignments_by_ids` | `POST` | `/apiv2/consignments/returnConsignments` | Batch lookup up to 100 IDs. Body: `{ ids: [...] }`. |
| `machship_get_consignments_by_reference1` | `POST` | `/apiv2/consignments/returnConsignmentsByReference1` | Finds consignments by Reference 1 (max 10). Body: `[...]`. |
| `machship_get_consignments_by_reference2` | `POST` | `/apiv2/consignments/returnConsignmentsByReference2` | Finds consignments by Reference 2 (max 10). Body: `[...]`. |
| `machship_get_consignments_by_carrier_id` | `POST` | `/apiv2/consignments/returnConsignmentsByCarrierConsignmentId` | Finds consignments by carrier tracking number (max 10). Body: `[...]`. |
| `machship_get_consignment_statuses` | `POST` | `/apiv2/consignments/returnConsignmentStatuses` | Batch tracking milestones. Body: `{ ids: [...] }`. |
| `machship_update_consignment_statuses` | `POST` | `/apiv2/consignments/updateConsignmentStatuses` | Pushes manual tracking milestones. |
| `machship_get_unmanifested_consignments` | `GET` | `/apiv2/consignments/getUnmanifested` | Paginated listing of unmanifested shipments. |
| `machship_get_active_consignments` | `GET` | `/apiv2/consignments/getActive` | Paginated listing of in-transit shipments. |
| `machship_get_all_consignments` | `GET` | `/apiv2/consignments/getAll` | Filterable broad search (dates, carriers, status). |
| `machship_get_recent_consignments` | `GET` | `/apiv2/consignments/getRecentlyCreatedOrUpdatedConsignments` | Incremental sync endpoint by UTC change window. |
| `machship_get_completed_consignments` | `GET` | `/apiv2/consignments/getCompleted` | Delivered shipments within date range (max 2000). |
| `machship_create_consignment` | `POST` | `/apiv2/consignments/createConsignment` | Primary booking endpoint with standard items. |
| `machship_create_consignment_with_complex_items` | `POST` | `/apiv2/consignments/createConsignmentwithComplexItems` | Booking with pallets, sub-items, and DG. |
| `machship_create_consignment_existing_items` | `POST` | `/apiv2/consignments/createExistingConsignment` | Booking referencing pre-saved item IDs. |
| `machship_edit_consignment` | `POST` | `/apiv2/consignments/editUnmanifestedConsignment` | Modifies an unmanifested consignment. |
| `machship_delete_consignments` | `POST` | `/apiv2/consignments/deleteUnmanifestedConsignments` | Removes unmanifested consignments. Body: `[...]`. |
| `machship_search_consignments` | `POST` | `/apiv2/consignments/searchConsignments` | Searches across all reference fields. Body: `[...]`. |
| `machship_get_consignment_creation_settings` | `GET` | `/apiv2/consignments/getConsignmentCreationSettings` | Discovers required fields and company defaults. |
| `machship_get_consignment_attachments` | `POST` | `/apiv2/consignments/getAttachments` | Metadata listing of attachments. Empty body; query param `?consignmentId=...`. |
| `machship_update_despatch_dates` | `POST` | `/apiv2/consignments/updateDespatchDatesForManifest` | Bulk updates pickup dates prior to manifesting. |
| `machship_get_consignment_by_pending_id` | `GET` | `/apiv2/consignments/getConsignmentByPendingConsignmentId` | Locates consignment converted from a pending draft. |
| `machship_get_consignment_for_clone` | `GET` | `/apiv2/consignments/getConsignmentForClone` | Exports consignment formatted for re-submission to `createConsignmentwithComplexItems`. |
| `machship_get_unmanifested_consignment_for_edit` | `GET` | `/apiv2/consignments/getUnmanifestedConsignmentForEdit` | Exports consignment formatted for `editUnmanifestedConsignment`. |
| `machship_get_consignments_by_pending_ids` | `POST` | `/apiv2/consignments/returnConsignmentsByPendingConsignmentIds` | Batch conversion lookup (max 100). Body: `{ ids: [...] }`. |

### 5.10 Consolidation (`src/tools/consolidation.ts`)
| Tool | HTTP Method | Endpoint | Description |
| :--- | :--- | :--- | :--- |
| `machship_group_consignments_for_consolidation` | `POST` | `/apiv2/consolidation/groupConsignmentsForConsolidation` | Preview grouping for unmanifested consignments into merged shipments. |
| `machship_perform_consolidation` | `POST` | `/apiv2/consolidation/performConsolidation` | Commits specified consolidation plan. |
| `machship_group_and_perform_consolidation` | `POST` | `/apiv2/consolidation/groupAndPerformConsolidation` | One-shot group and commit execution. |

### 5.11 Manifests & Carrier Pickups (`src/tools/manifests.ts`)
| Tool | HTTP Method | Endpoint | Description |
| :--- | :--- | :--- | :--- |
| `machship_get_manifests` | `GET` | `/apiv2/manifests/getAll` | Paginated listing of booked manifests. |
| `machship_group_all_for_manifest` | `POST` | `/apiv2/manifests/groupAllUnmanifestedConsignmentsForManifest` | Scans all unmanifested shipments and proposes manifest groups. Body: number `companyId`. |
| `machship_group_consignments_for_manifest` | `POST` | `/apiv2/manifests/groupConsignmentsForManifest` | Proposes manifest groupings for specific consignment IDs. Body: `[...]`. |
| `machship_manifest_consignments` | `POST` | `/apiv2/manifests/manifest` | Commits manifest, dispatches EDI to carrier, and locks consignments. |
| `machship_rebook_manifest_pickup` | `POST` | `/apiv2/manifests/rebookPickup` | Rebooks carrier pickup for missed or failed pickups. |

### 5.12 Labels & Printing (`src/tools/labels.ts`)
| Tool | HTTP Method | Endpoint | Description |
| :--- | :--- | :--- | :--- |
| `machship_get_consignment_label_pdf` | `GET` | `/apiv2/labels/getConsignmentPdf` | Consignment summary label PDF. |
| `machship_get_item_label_pdf` | `GET` | `/apiv2/labels/getItemPdf` | Individual parcel barcode labels PDF (carrier A6 or A4). |
| `machship_get_item_labels_zip` | `GET` | `/apiv2/labels/getItemPdfsForConsignments` | Batch item labels ZIP for up to 40 consignments (GET query string). |
| `machship_get_manifest_label_pdf` | `GET` | `/apiv2/labels/getManifestPdf` | Manifest driver summary sheet PDF by manifest ID. |
| `machship_get_manifest_label_pdf_by_consignment` | `GET` | `/apiv2/labels/getManifestPdfByConsignmentId` | Manifest sheet PDF by consignment ID. |
| `machship_get_commercial_invoice_pdf` | `GET` | `/apiv2/labels/getCommercialInvoicePdf` | Export commercial invoice PDF. |
| `machship_get_dangerous_goods_pdf` | `GET` | `/apiv2/labels/getDangerousGoodsDocumentPdf` | Dangerous goods declaration document PDF. |
| `machship_send_labels_to_printer` | `POST` | `/apiv2/labels/sendLabelsToPrinter` | Queues print jobs to physical MachShip Print Service. |
| `machship_group_consignments_for_printing` | `POST` | `/apiv2/labels/groupConsignmentsForPrinting` | Groups print jobs by printer/carrier. Body: `[...]`. |
| `machship_get_consignment_pdf_file_info` | `GET` | `/apiv2/labels/getConsignmentPdfFileInfo` | Returns base64 payload in JSON for consignment label. |
| `machship_get_item_pdf_file_info` | `GET` | `/apiv2/labels/getItemPdfFileInfo` | Returns base64 payload in JSON for item labels. |
| `machship_get_manifest_pdf_file_info` | `GET` | `/apiv2/labels/getManifestPdfFileInfo` | Returns base64 payload in JSON for manifest sheet. |
| `machship_get_dangerous_goods_pdf_file_info` | `GET` | `/apiv2/labels/getDangerousGoodsDocumentPdfFileInfo` | Returns base64 payload in JSON for DG form. |
| `machship_get_mo41_document_pdf` | `GET` | `/apiv2/labels/getMO41DocumentPdf` | Maritime AMSA MO41 DG compliance PDF. |
| `machship_get_mo41_document_pdf_file_info` | `GET` | `/apiv2/labels/getMO41DocumentPdfFileInfo` | Returns base64 payload in JSON for MO41 form. |
| `machship_get_special_instructions_pdf` | `GET` | `/apiv2/labels/getSpecialInstructionsPdf` | Special handling instructions PDF. |
| `machship_return_item_pdfs_for_consignments` | `POST` | `/apiv2/labels/returnItemPdfsForConsignments` | Recommended batch item labels ZIP for up to 40 consignments (POST body). |

### 5.13 Attachments & Proof of Delivery (`src/tools/attachments.ts`)
| Tool | HTTP Method | Endpoint | Description |
| :--- | :--- | :--- | :--- |
| `machship_get_attachment` | `GET` | `/apiv2/attachments/getAttachment` | Downloads raw attachment file bytes (e.g. carrier POD scan). |
| `machship_get_attachment_pod_report` | `GET` | `/apiv2/attachments/getAttachmentPodReport` | Downloads MachShip-branded POD report PDF with signature and consignment details. |
| `machship_get_attachments_by_consignment_ids` | `GET` | `/apiv2/attachments/getAttachmentsByConsignmentIds` | Bulk downloads attachments for up to 40 consignments as ZIP. |
| `machship_upload_attachments` | `POST` | `/apiv2/attachments/uploadAttachments` | Uploads base64-encoded files to a consignment. |

### 5.14 Notes (`src/tools/notes.ts`)
| Tool | HTTP Method | Endpoint | Description |
| :--- | :--- | :--- | :--- |
| `machship_get_consignment_notes` | `GET` | `/apiv2/notes/getNotesForConsignment` | Retrieves audit trail and comments for a consignment. |

### 5.15 Invoicing Subsystems
#### Carrier Invoices (`src/tools/carrier-invoices.ts`)
| Tool | HTTP Method | Endpoint | Description |
| :--- | :--- | :--- | :--- |
| `machship_get_carrier_invoices` | `GET` | `/apiv2/carrierInvoices/getAll` | Lists carrier invoice batches (max 100). |
| `machship_get_carrier_invoice_entries` | `GET` | `/apiv2/carrierInvoices/getEntriesForInvoice` | Retrieves line items for an invoice with status filter. |
| `machship_update_reprice_consignment` | `POST` | `/apiv2/carrierInvoices/updateAndRepriceConsignment` | Updates items with carrier audited weights and triggers repricing. |
| `machship_attempt_auto_reconciliation` | `POST` | `/apiv2/carrierInvoices/attemptAutoReconciliation` | Executes tolerance-based reconciliation. |

#### Commercial Invoices (`src/tools/commercial-invoices.ts`)
| Tool | HTTP Method | Endpoint | Description |
| :--- | :--- | :--- | :--- |
| `machship_upload_commercial_invoice` | `POST` | `/apiv2/commercialInvoices/uploadCommercialInvoice` | Uploads customs invoice files via multipart/form-data. |

#### Financial Invoices (`src/tools/financial-invoices.ts`)
| Tool | HTTP Method | Endpoint | Description |
| :--- | :--- | :--- | :--- |
| `machship_get_posted_invoices` | `GET` | `/apiv2/financialInvoice/getAllPosted` | Lists posted customer-facing invoices. |
| `machship_get_invoice_by_document_number` | `GET` | `/apiv2/financialInvoice/getPostedInvoiceByDocumentNumber` | Fetches invoice line items with optional embedded PDF bytes. |

### 5.16 Identity & Access Management (`src/tools/identities.ts` & `src/tools/identity-providers.ts`)
| Tool | HTTP Method | Endpoint | Description |
| :--- | :--- | :--- | :--- |
| `machship_get_identities` | `GET` | `/apiv2/identities/getIdentities` | Lists organization identities and linked companies. |
| `machship_get_identity` | `GET` | `/apiv2/identities/getIdentity` | Full identity record by ID. |
| `machship_get_available_roles` | `GET` | `/apiv2/identities/getAvailableRoles` | Lists assignable user roles for a company. |
| `machship_create_identities` | `POST` | `/apiv2/identities/createIdentities` | Batch provisions user identities and roles. |
| `machship_update_identity` | `POST` | `/apiv2/identities/updateIdentity` | Overwrites identity fields. *Omitted optional fields are set to null on server.* |
| `machship_delete_identities` | `POST` | `/apiv2/identities/deleteIdentities` | Deletes identities. Body: `[...]`. |
| `machship_disable_identities` | `POST` | `/apiv2/identities/disableIdentities` | Suspends login access. Body: `[...]`. |
| `machship_reenable_identities` | `POST` | `/apiv2/identities/reenableIdentities` | Restores login access. Body: `[...]`. |
| `machship_link_identities_to_companies` | `POST` | `/apiv2/identities/linkIdentitiesToCompanies` | Associates users to companies with roles. Body: `{ links: [...] }`. |
| `machship_unlink_identities_from_companies` | `POST` | `/apiv2/identities/unlinkIdentitiesFromCompanies` | Removes company access. Body: `[...]`. |
| `machship_return_identity_public_keys` | `POST` | `/apiv2/identities/returnIdentityPublicKeys` | Fetches public keys for cross-org links. Body: `[...]`. |
| `machship_get_identity_provider` | `GET` | `/apiv2/identityproviders/GetIdentityProvider` | Returns SSO/IdP configuration. |
| `machship_get_identity_providers_for_company` | `GET` | `/apiv2/identityproviders/GetIdentityProvidersForCompany` | Lists IdPs for a company. |
| `machship_get_identity_providers_for_logged_user` | `GET` | `/apiv2/identityproviders/GetIdentityProvidersForLoggedUser` | Lists IdPs for current user. |
| `machship_get_identity_providers_for_organisation` | `GET` | `/apiv2/identityproviders/GetIdentityProvidersForOrganisation` | Lists IdPs for an organization. |

### 5.17 Multi-Tenant Organisation Links (`src/tools/organisation-links.ts`)
| Tool | HTTP Method | Endpoint | Description |
| :--- | :--- | :--- | :--- |
| `machship_get_organisation_links` | `GET` | `/apiv2/organisationLinks/getForOrganisation` | Lists active B2B integration links. |
| `machship_get_linked_from_organisations` | `GET` | `/apiv2/organisationLinks/getLinkedFromOrganisations` | Upstream suppliers/partners linked into org. |
| `machship_get_linked_to_organisations` | `GET` | `/apiv2/organisationLinks/getLinkedToOrganisations` | Downstream clients linked to org. |
| `machship_get_organisation_public_key` | `GET` | `/apiv2/organisationLinks/getPublicKeyForOrganisation` | Returns org public key. |
| `machship_get_organisation_by_public_key` | `GET` | `/apiv2/organisationLinks/getOrganisationDetailsByPublicKey` | Validates external partner public key. |
| `machship_add_organisation_link` | `POST` | `/apiv2/organisationLinks/add` | Establishes partner link using public key. |
| `machship_remove_organisation_link` | `POST` | `/apiv2/organisationLinks/remove` | Removes partner link. |
| `machship_reset_organisation_public_key` | `GET` | `/apiv2/organisationLinks/resetPublicKeyForOrganisation` | Regenerates org public key. *GET request mutates key on server.* |

### 5.18 Custom Schemas (`src/tools/custom-schemas.ts`)
| Tool | HTTP Method | Endpoint | Description |
| :--- | :--- | :--- | :--- |
| `machship_get_custom_schemas` | `GET` | `/api/customSchemas/getAll` | Returns all schema extensions. *Notice `/api` prefix without `v2`.* |
| `machship_get_custom_schema` | `GET` | `/api/customSchemas/getByDotNetClassId` | Retrieves schema by .NET class type ID. |
| `machship_create_custom_schema` | `POST` | `/api/customSchemas/create` | Registers JSON Schema extension on an entity. |
| `machship_update_custom_schema` | `POST` | `/api/customSchemas/updateByDotNetClassId` | Modifies custom schema. |
| `machship_delete_custom_schema` | `POST` | `/api/customSchemas/deleteByDotNetClassId` | Deletes schema. Query param `?id=...`; empty body. |

---

## 6. Critical Gotchas, Quirks & Pitfalls

### 1. Legacy API Route on Custom Schemas
All standard endpoints route through `/apiv2/*`. Custom schema endpoints route to `/api/customSchemas/*` (lacks `v2`). Calling `/apiv2/customSchemas/*` returns 404.

### 2. URL Path Casing Inconsistencies
- Routes: Endpoints are entirely lowercase (`/apiv2/routes/returnroutes`, `/returnmultipleroutes`, `/returnrouteswithcomplexitems`).
- Complex Consignments: Lowercase 'w' in `/apiv2/consignments/createConsignmentwithComplexItems`.
- Identity Providers: PascalCase sub-paths (`/apiv2/identityproviders/GetIdentityProvider`).
- Financial Invoices: Singular noun `/apiv2/financialInvoice/getAllPosted` (versus plural `/apiv2/carrierInvoices/*`).

### 3. HTTP Verb Divergence
- `machship_ping`: Uses `POST /apiv2/authenticate/ping` despite being a read-only query.
- Deletions: `delete_identities`, `delete_pending_consignments`, `delete_consignments`, `remove_organisation_link`, and `delete_custom_schema` all use `POST`. Only `delete_item` uses the `DELETE` verb.
- Public Key Reset: `reset_organisation_public_key` issues a `GET` request that mutates the key on the server.
- Attachment Metadata: `machship_get_consignment_attachments` issues `POST /apiv2/consignments/getAttachments` with an empty body and `?consignmentId=...` in the query string.

### 4. Payload Body Wrapping Asymmetries
Be precise with payload shapes when creating or querying batches:
- **Wrapped in an object:**
  - `machship_get_consignments_by_ids`: `{ ids: [1, 2] }`
  - `machship_get_pending_consignments_by_ids`: `{ ids: [1, 2] }`
  - `machship_get_consignment_statuses`: `{ ids: [1, 2] }`
  - `machship_get_consignments_by_pending_ids`: `{ ids: [1, 2] }`
  - `machship_link_identities_to_companies`: `{ links: [...] }`
- **Raw array / primitive directly in body:**
  - `machship_delete_consignments`: `[1, 2]`
  - `machship_delete_pending_consignments`: `[1, 2]`
  - `machship_delete_identities`: `[1, 2]`
  - `machship_group_consignments_for_manifest`: `[1, 2]`
  - `machship_unlink_identities_from_companies`: `[...]`
  - `machship_group_all_for_manifest`: `1790` (raw numeric company ID)

### 5. Identity Full Overwrite Danger
`machship_update_identity` replaces the entire record. Omitted optional fields (phone, position, notes) are overwritten with `null` on the server. Always supply current values for all fields when updating an identity.

### 6. Silent SKU Drops on Batch Queries
`machship_get_items_by_skus` takes up to 100 SKUs. If a SKU does not exist, MachShip omits it from the returned array without an error. Callers must diff requested SKUs against returned items.

### 7. Binary Files & PDF Handling
- The raw label, document and attachment endpoints (`getConsignmentPdf`, `getItemPdfsForConsignments`, `getAttachment` and others) return file bytes, not JSON. Their tools call `apiFile` (`responseType: 'arraybuffer'`) and return `{ fileBase64, contentType, sizeBytes }` through `fileResponse`. Do not call these endpoints with `apiGet`: its JSON mode decodes the bytes as UTF-8 and damages the file.
- `fileResponse` never truncates base64. When the result is over 25,000 characters, the text holds only `contentType` and `sizeBytes`, and the file is in `structuredContent.fileBase64`.
- The `*FileInfo` endpoints return JSON: `object.content` is the file as base64, with `object.fileName` and `object.contentType`. These go through `successResponse`, so their text is truncated at 25,000 characters. Read `structuredContent`.

---

## 7. Build, Verification & Maintenance

### Build Memory Constraint
Compiling 125 tools with deep Zod inference requires 4GB of Node.js heap memory:
```bash
# Correct build command (matches package.json script)
node --max-old-space-size=4096 node_modules/typescript/bin/tsc && node scripts/ensure-executable.js
```
Running plain `tsc` will fail with a JavaScript heap Out Of Memory (OOM) error.

### Verification Commands
```bash
# Type check and build
yarn build

# Lint source tree
yarn lint

# Live development server
yarn dev
```

### Package Manager
Yarn 1 only (`yarn.lock`, `"packageManager": "yarn@1.22.22"`). `package-lock.json` is gitignored; never run `npm install`. Use `yarn audit`, not `npm audit`.

### Single Zod Copy
The tools use zod 4, and the MCP SDK (`zod ^3.25 || ^4.0`) resolves to the same copy. Keep one runtime zod in `yarn.lock`: a second copy under the SDK makes `tsc` run out of memory. Only `@anthropic-ai/mcpb` (dev) keeps its own zod 3. zod 4 needs two arguments for records: write `z.record(z.string(), z.unknown())`.

### MCPB Bundle
```bash
yarn bundle   # build + sync manifest tools + pack machship-mcp.mcpb
```
- `scripts/sync-manifest-tools.js` starts `dist/index.js` without a token and writes `manifest.json` `tools` from `tools/list`. Commit the result whenever tools change. `server.json` has no tool list: the MCP Registry rejects publisher metadata over 4 KB.
- `scripts/build-mcpb.js` packs a staging copy with production dependencies only, then runs `mcpb validate` and `mcpb pack`.

### Version Bumping & Releases
Run `node scripts/update-version.js <new-version>` to synchronize versions simultaneously across `package.json`, `src/utils/constants.ts`, `server.json` (both version fields), and `manifest.json`.

Releases run on push to `main` (semantic-release): `feat:`/`fix:` commits trigger a version bump, `yarn bundle`, npm publish (public), a git tag, and a GitHub release with `machship-mcp.mcpb` attached. The GitHub release notes are the changelog.

The Claude Code plugin files (`.claude-plugin/plugin.json` `version` and the `.mcp.json` package pin) are not in `update-version.js`. The plugin directory reads them from git, so set them to `X.Y.Z` in the pull request that releases `X.Y.Z`.

The release never commits back to `main`: the org ruleset requires a pull request for every change to the default branch, with no bypass. CI writes the version into the version files before the build, so the published npm package, the bundle and the running server all carry the released version, while the files in the repo keep their last committed value. The git tags are the source of truth for versions.

npm auth uses trusted publishing (OIDC): the release job runs on Node 24 (npm 11) with `id-token: write`, and the package has a trusted publisher for `devkindhq/machship-mcp` / `ci-semantic-release.yml`. No `NPM_TOKEN` secret should exist; a short-lived token was used only for the first publish. Do not add `@semantic-release/npm` or `@semantic-release/github` to `devDependencies` — semantic-release loads its own bundled copies first, so a separate copy is silently ignored.


---
name: machship-freight
description: Use when a user asks to quote, rate, ship, book, label, manifest, track, edit, cancel or re-send freight through Machship, or names a consignment, order reference, carrier tracking number or pickup, in Australia or New Zealand. Also use when a machship_* tool returns an error, a validation error or a truncated response.
---

# Machship freight workflow

## Overview

The Machship MCP server has more tools than one job needs. A freight job uses a small set of them, in a fixed order. Each step gives an ID that the next step needs. Two calls commit the user to a carrier: consignment creation and manifesting. Ask the user before each of them.

## Before the first call

1. `machship_ping` checks the token and returns the session context.
   - `Machship API token is not set` or `Error 401`: tell the user to set `machship_api_token` in the plugin settings, or `MACHSHIP_API_TOKEN`. Do not retry.
   - `Error 403`: the token lacks permission for that resource.
2. `machship_get_companies` gives `companyId`. Most tools need it. If more than one company comes back, ask which one.

## The workflow

| Step | Tool | Needs | Gives |
|---|---|---|---|
| 1. Origin | `machship_get_company_locations` | `companyId` | the warehouse `fromCompanyLocationId`, plus its suburb, postcode and state for step 4 |
| 2. Destination | `machship_search_locations` (`s: "Parramatta 2150"`, max 10 results) or `machship_get_locations_exact` | suburb, postcode | a valid suburb, postcode and state |
| 3. Options (if the user names a carrier or account) | `machship_get_company_carriers` | `companyId` | `carrierId`, `accountId`, `serviceId` |
| 4. Rates | `machship_get_routes` (read-only, saves nothing) or `machship_create_quote` (saves a quote) | `companyId`, from/to location, items with weight (kg), length/width/height (cm), `name`, `quantity` | carrier and service options with price and ETA |
| 5. Required fields | `machship_get_consignment_creation_settings` | `companyId` | required fields and defaults |
| 6. Create | `machship_create_consignment` | `companyId`, `fromCompanyLocationId`, `toAddress`, items, `carrierId`, `serviceId`; optional `reference1`, `reference2` | the new consignment ID (unmanifested) |
| 7. Labels | `machship_get_consignment_pdf_file_info`, `machship_get_item_pdf_file_info` | `consignmentId` | label file |
| 8. Preview manifest | `machship_group_consignments_for_manifest` | consignment IDs | manifest groups |
| 9. Book | `machship_manifest_consignments` | `manifests` array (consignment IDs, carrier, despatch date) | pickup booking and tracking numbers |
| 10. Manifest PDF | `machship_get_manifest_label_pdf_by_consignment`, or `machship_get_manifest_pdf_file_info` with a manifest ID from `machship_get_manifests` | `consignmentId`, or manifest ID | manifest file |
| 11. Track | `machship_get_consignment_statuses` | `ids`, optional `sinceDateCreatedUtc` | status events |

Variants:
- Dangerous goods or detailed packaging: `machship_get_routes_complex_items`, `machship_create_quote_complex_items`, `machship_create_consignment_with_complex_items`.
- Saved catalogue items: `machship_create_consignment_existing_items`.
- Many shipments: `machship_get_routes_batch`; labels for up to 40 consignments with `machship_get_item_labels_zip`.
- Draft before rating: `machship_create_pending_consignment`. Find the real consignment later with `machship_get_consignment_by_pending_id`.
- Missed pickup: `machship_rebook_manifest_pickup` (needs the manifest ID).
- Print: `machship_group_consignments_for_printing`, then `machship_send_labels_to_printer`.

The consignment, quote, route and manifest payloads are free-form objects. Use only the field names in the tool description and in the creation settings. Do not guess others.

## Ask the user before these calls

Show what the call will do and wait for a yes:

| Call | Why |
|---|---|
| `machship_create_consignment*` | Creates a consignment against a carrier and price. Show carrier, service, price, ETA, addresses and references. |
| `machship_manifest_consignments` | Books the carrier. After this, no tool here can edit, delete or cancel the consignment. |
| `machship_edit_consignment`, `machship_rebook_manifest_pickup`, `machship_send_labels_to_printer`, `machship_upload_attachments`, `machship_update_consignment_statuses`, `machship_update_despatch_dates`, `machship_perform_consolidation`, `machship_group_and_perform_consolidation` | Writes to Machship or to a carrier. None are idempotent: a retry can duplicate. |
| `machship_create_pending_consignment`, `machship_upload_commercial_invoice` | Creates a record in Machship. Not idempotent. |
| `machship_delete_consignments`, `machship_delete_pending_consignments` | Marked destructive. Cannot be undone. |

`machship_create_quote` and `machship_create_quote_complex_items` save a quote record (`readOnlyHint: false`). They are not a free rate check. For rates only, use `machship_get_routes`.

"Cheapest" is not consent. Show the cheapest option and ask.

After a timeout on a create or manifest call, look for the consignment (`machship_get_consignments_by_reference1` or `machship_get_unmanifested_consignments`) before you retry.

## Change, cancel or re-send

1. Find it: `machship_get_consignments_by_reference1` / `_reference2` (max 10 values), `machship_get_consignments_by_carrier_id` (carrier tracking number), or `machship_search_consignments`.
2. Check the state. It is unmanifested if it is in `machship_get_unmanifested_consignments` for that `companyId` (page through all of it, or filter by `carrierId`). Also read `machship_get_consignment_statuses`: goods in transit need a reship, not an edit.
3. Unmanifested:
   - Change: `machship_get_unmanifested_consignment_for_edit`, change the fields, then send the whole object to `machship_edit_consignment`.
   - Cancel: `machship_delete_consignments` with `ids`, after the user confirms.
4. Manifested: no tool on this server cancels or edits it. Tell the user to cancel with the carrier or in Machship. To send a replacement, `machship_get_consignment_for_clone` gives a body for `machship_create_consignment_with_complex_items`. Re-rate the new address with `machship_get_routes_complex_items` first, and ask whether to keep the old references. Warn that a second booking can mean a second freight charge.

## Reports and bulk tracking

- Consignments in a date range: `machship_get_all_consignments` with `companyId`, `fromDateTimeLocal`, `toDateTimeLocal`, paged (see below). Ask the user which date "sent" means; the schema does not say which date the filter uses.
- `machship_get_recent_consignments` matches consignments created or updated in a UTC range. Use it for sync, not for "what we sent in October".
- Then `machship_get_consignment_statuses` with the IDs. The schema sets no maximum on `ids`; send moderate batches and make them smaller after a timeout.
- Give a summary by status and a list of exceptions, not hundreds of rows in chat.

## Attachments and notes

- `machship_get_consignment_attachments` lists attachment metadata. `machship_get_attachment` (by attachment ID) returns base64 content. `machship_get_attachment_pod_report` gives the proof of delivery report.
- `machship_get_attachments_by_consignment_ids` takes up to 40 consignment IDs.
- `machship_upload_attachments` needs `consignmentId`, `fileName`, `fileBase64`.
- International: `machship_upload_commercial_invoice`, `machship_get_commercial_invoice_pdf`.
- `machship_get_consignment_notes` takes the consignment ID as `id`.

## Large results and files

- Text output stops at 25,000 characters and ends with `[TRUNCATED: ...]`. The full data is in `structuredContent`. Read it there. Never report a truncated list as complete.
- List tools page with `startIndex` (from 1) and `retrieveSize` (default 40, max 200): `machship_get_all_consignments`, `machship_get_unmanifested_consignments`, `machship_get_active_consignments`, `machship_get_recent_consignments`, `machship_get_manifests`. The schema does not say if `startIndex` counts rows or pages. Check that page 2 does not repeat IDs from page 1.
- Narrow with filters before paging: `fromDateTimeLocal` / `toDateTimeLocal`, `carrierId`. `machship_get_completed_consignments` returns at most 2000 results.
- Batch limits: `machship_get_consignments_by_ids` 100, reference lookups 10, label and attachment zips 40.
- The `*_file_info` tools return the file as base64 in `object.content`, with `fileName` and `contentType`.
- The raw `*_pdf`, zip and attachment tools return `{ fileBase64, contentType, sizeBytes }`. A file over 25,000 characters is only in `structuredContent.fileBase64`.
- Save the decoded file when the client can write files. Do not paste base64 into the chat.

## Errors

| Message | Action |
|---|---|
| Starts with `Error 400: Bad request` | Read the detail. Fix the named field. Check the creation settings. |
| A non-empty `errors` array in a result | Treat the call as failed. Report the errors to the user. |
| `Error 404` | Wrong ID, or the token cannot access it. |
| `Error 429` | Wait, then retry once. |
| `Request timed out (30s)` | Narrow the query. For a write, check that it did not succeed before you retry. |

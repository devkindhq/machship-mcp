import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { apiGet, apiPost, errorResponse, successResponse } from "../client.js";

export function registerLabelsTools(server: McpServer): void {
  server.registerTool(
    "machship_get_consignment_label_pdf",
    {
      title: "Get Consignment Label PDF",
      description: `Returns the consignment label as a PDF (base64 or file bytes).

Args:
  - consignmentId (number): Consignment ID`,
      inputSchema: z.object({
        consignmentId: z.number().int().positive().describe("Consignment ID")
      }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async ({ consignmentId }) => {
      try {
        const data = await apiGet<unknown>("/apiv2/labels/getConsignmentPdf", { consignmentId });
        return successResponse(data);
      } catch (e) {
        return errorResponse(e);
      }
    }
  );

  server.registerTool(
    "machship_get_item_label_pdf",
    {
      title: "Get Item Label PDF",
      description: `Returns item/package labels for a consignment as a PDF.

Args:
  - consignmentId (number): Consignment ID
  - printA4 (boolean, optional): Print in A4 format (default: label-size)`,
      inputSchema: z.object({
        consignmentId: z.number().int().positive().describe("Consignment ID"),
        printA4: z.boolean().optional().describe("Print in A4 format")
      }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async ({ consignmentId, printA4 }) => {
      try {
        const data = await apiGet<unknown>("/apiv2/labels/getItemPdf", { consignmentId, printA4 });
        return successResponse(data);
      } catch (e) {
        return errorResponse(e);
      }
    }
  );

  server.registerTool(
    "machship_get_item_labels_zip",
    {
      title: "Get Item Labels ZIP (Batch)",
      description: `Gets item labels as a zip file for up to 40 consignments.

Args:
  - consignmentIds (number[]): Consignment IDs (max 40)
  - printA4 (boolean, optional): Print in A4 format
  - singlePdf (boolean, optional): Combine all labels into a single PDF inside the zip`,
      inputSchema: z.object({
        consignmentIds: z.array(z.number().int().positive()).min(1).max(40).describe("Consignment IDs (max 40)"),
        printA4: z.boolean().optional().describe("Print in A4 format"),
        singlePdf: z.boolean().optional().describe("Combine into single PDF")
      }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async ({ consignmentIds, printA4, singlePdf }) => {
      try {
        const data = await apiGet<unknown>("/apiv2/labels/getItemPdfsForConsignments", { consignmentIds, printA4, singlePdf });
        return successResponse(data);
      } catch (e) {
        return errorResponse(e);
      }
    }
  );

  server.registerTool(
    "machship_get_manifest_label_pdf",
    {
      title: "Get Manifest Label PDF",
      description: `Returns the manifest document as a PDF by manifest ID.

Args:
  - manifestId (number): Manifest ID`,
      inputSchema: z.object({
        manifestId: z.number().int().positive().describe("Manifest ID")
      }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async ({ manifestId }) => {
      try {
        const data = await apiGet<unknown>("/apiv2/labels/getManifestPdf", { manifestId });
        return successResponse(data);
      } catch (e) {
        return errorResponse(e);
      }
    }
  );

  server.registerTool(
    "machship_get_manifest_label_pdf_by_consignment",
    {
      title: "Get Manifest Label PDF by Consignment",
      description: `Returns the manifest PDF for the manifest associated with a given consignment.

Args:
  - consignmentId (number): Consignment ID`,
      inputSchema: z.object({
        consignmentId: z.number().int().positive().describe("Consignment ID")
      }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async ({ consignmentId }) => {
      try {
        const data = await apiGet<unknown>("/apiv2/labels/getManifestPdfByConsignmentId", { consignmentId });
        return successResponse(data);
      } catch (e) {
        return errorResponse(e);
      }
    }
  );

  server.registerTool(
    "machship_get_commercial_invoice_pdf",
    {
      title: "Get Commercial Invoice PDF",
      description: `Returns the commercial invoice PDF for a consignment (used for international shipments).

Args:
  - consignmentId (number): Consignment ID`,
      inputSchema: z.object({
        consignmentId: z.number().int().positive().describe("Consignment ID")
      }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async ({ consignmentId }) => {
      try {
        const data = await apiGet<unknown>("/apiv2/labels/getCommercialInvoicePdf", { consignmentId });
        return successResponse(data);
      } catch (e) {
        return errorResponse(e);
      }
    }
  );

  server.registerTool(
    "machship_get_dangerous_goods_pdf",
    {
      title: "Get Dangerous Goods Document PDF",
      description: `Returns the dangerous goods declaration document PDF for a consignment.

Args:
  - consignmentId (number): Consignment ID`,
      inputSchema: z.object({
        consignmentId: z.number().int().positive().describe("Consignment ID")
      }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async ({ consignmentId }) => {
      try {
        const data = await apiGet<unknown>("/apiv2/labels/getDangerousGoodsDocumentPdf", { consignmentId });
        return successResponse(data);
      } catch (e) {
        return errorResponse(e);
      }
    }
  );

  server.registerTool(
    "machship_send_labels_to_printer",
    {
      title: "Send Labels to Printer",
      description: `Sends labels directly to a configured printer in Machship.

Args:
  - requests (array): Array of print requests, each with consignmentId, printerId, labelType, etc.`,
      inputSchema: z.object({
        requests: z.array(z.record(z.unknown())).min(1).describe("Print requests (consignmentId, printerId, labelType)")
      }).strict(),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true }
    },
    async ({ requests }) => {
      try {
        const data = await apiPost<unknown>("/apiv2/labels/sendLabelsToPrinter", requests);
        return successResponse(data);
      } catch (e) {
        return errorResponse(e);
      }
    }
  );

  server.registerTool(
    "machship_group_consignments_for_printing",
    {
      title: "Group Consignments for Printing",
      description: `Groups consignments for batch label printing and returns print groups.

Args:
  - consignmentIds (number[]): Consignment IDs to group for printing`,
      inputSchema: z.object({
        consignmentIds: z.array(z.number().int().positive()).min(1).describe("Consignment IDs")
      }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: false, openWorldHint: true }
    },
    async ({ consignmentIds }) => {
      try {
        const data = await apiPost<unknown>("/apiv2/labels/groupConsignmentsForPrinting", consignmentIds);
        return successResponse(data);
      } catch (e) {
        return errorResponse(e);
      }
    }
  );

  server.registerTool(
    "machship_get_consignment_pdf_file_info",
    {
      title: "Get Consignment PDF File Info",
      description: `Returns file metadata (name, size, URL) for the consignment label PDF without downloading it.

Args:
  - consignmentId (number): Consignment ID`,
      inputSchema: z.object({
        consignmentId: z.number().int().positive().describe("Consignment ID")
      }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async ({ consignmentId }) => {
      try {
        const data = await apiGet<unknown>("/apiv2/labels/getConsignmentPdfFileInfo", { consignmentId });
        return successResponse(data);
      } catch (e) {
        return errorResponse(e);
      }
    }
  );

  server.registerTool(
    "machship_get_item_pdf_file_info",
    {
      title: "Get Item Label PDF File Info",
      description: `Returns file metadata for the item/package label PDF without downloading it.

Args:
  - consignmentId (number): Consignment ID
  - printA4 (boolean, optional): Whether the label is in A4 format`,
      inputSchema: z.object({
        consignmentId: z.number().int().positive().describe("Consignment ID"),
        printA4: z.boolean().optional().describe("A4 format flag")
      }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async ({ consignmentId, printA4 }) => {
      try {
        const data = await apiGet<unknown>("/apiv2/labels/getItemPdfFileInfo", { consignmentId, printA4 });
        return successResponse(data);
      } catch (e) {
        return errorResponse(e);
      }
    }
  );

  server.registerTool(
    "machship_get_manifest_pdf_file_info",
    {
      title: "Get Manifest PDF File Info",
      description: `Returns file metadata for the manifest PDF without downloading it.

Args:
  - manifestId (number): Manifest ID`,
      inputSchema: z.object({
        manifestId: z.number().int().positive().describe("Manifest ID")
      }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async ({ manifestId }) => {
      try {
        const data = await apiGet<unknown>("/apiv2/labels/getManifestPdfFileInfo", { manifestId });
        return successResponse(data);
      } catch (e) {
        return errorResponse(e);
      }
    }
  );

  server.registerTool(
    "machship_get_dangerous_goods_pdf_file_info",
    {
      title: "Get Dangerous Goods Document PDF File Info",
      description: `Returns file metadata for the dangerous goods declaration PDF without downloading it.

Args:
  - consignmentId (number): Consignment ID`,
      inputSchema: z.object({
        consignmentId: z.number().int().positive().describe("Consignment ID")
      }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async ({ consignmentId }) => {
      try {
        const data = await apiGet<unknown>("/apiv2/labels/getDangerousGoodsDocumentPdfFileInfo", { consignmentId });
        return successResponse(data);
      } catch (e) {
        return errorResponse(e);
      }
    }
  );

  server.registerTool(
    "machship_get_mo41_document_pdf",
    {
      title: "Get MO41 Document PDF",
      description: `Returns the MO41 document PDF for a consignment (used for specific carrier compliance documents).

Args:
  - consignmentId (number): Consignment ID`,
      inputSchema: z.object({
        consignmentId: z.number().int().positive().describe("Consignment ID")
      }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async ({ consignmentId }) => {
      try {
        const data = await apiGet<unknown>("/apiv2/labels/getMO41DocumentPdf", { consignmentId });
        return successResponse(data);
      } catch (e) {
        return errorResponse(e);
      }
    }
  );

  server.registerTool(
    "machship_get_mo41_document_pdf_file_info",
    {
      title: "Get MO41 Document PDF File Info",
      description: `Returns file metadata for the MO41 document PDF without downloading it.

Args:
  - consignmentId (number): Consignment ID`,
      inputSchema: z.object({
        consignmentId: z.number().int().positive().describe("Consignment ID")
      }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async ({ consignmentId }) => {
      try {
        const data = await apiGet<unknown>("/apiv2/labels/getMO41DocumentPdfFileInfo", { consignmentId });
        return successResponse(data);
      } catch (e) {
        return errorResponse(e);
      }
    }
  );

  server.registerTool(
    "machship_get_special_instructions_pdf",
    {
      title: "Get Special Instructions PDF",
      description: `Returns the special instructions document PDF for a consignment.

Args:
  - consignmentId (number): Consignment ID
  - printA4 (boolean, optional): Print in A4 format`,
      inputSchema: z.object({
        consignmentId: z.number().int().positive().describe("Consignment ID"),
        printA4: z.boolean().optional().describe("Print in A4 format")
      }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async ({ consignmentId, printA4 }) => {
      try {
        const data = await apiGet<unknown>("/apiv2/labels/getSpecialInstructionsPdf", { consignmentId, printA4 });
        return successResponse(data);
      } catch (e) {
        return errorResponse(e);
      }
    }
  );

  server.registerTool(
    "machship_return_item_pdfs_for_consignments",
    {
      title: "Return Item PDFs for Consignments (POST)",
      description: `Returns item labels as a zip for up to 40 consignments (POST variant — use this when passing a body payload is preferred over query string).

Args:
  - consignmentIds (number[]): Consignment IDs (max 40)
  - printA4 (boolean, optional): Print in A4 format`,
      inputSchema: z.object({
        consignmentIds: z.array(z.number().int().positive()).min(1).max(40).describe("Consignment IDs (max 40)"),
        printA4: z.boolean().optional().describe("Print in A4 format")
      }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async ({ consignmentIds, printA4 }) => {
      try {
        const data = await apiPost<unknown>("/apiv2/labels/returnItemPdfsForConsignments", { consignmentIds, printA4 });
        return successResponse(data);
      } catch (e) {
        return errorResponse(e);
      }
    }
  );
}

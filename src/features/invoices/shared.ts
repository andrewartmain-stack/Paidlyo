import { z } from "zod";
import type { InvoiceDocumentData, InvoiceSender } from "./types";

/** Shape returned by the get_shared_invoice RPC (see migration invoice_share_links). */
const sharedInvoiceJson = z.object({
  number: z.string(),
  status: z.enum(["sent", "partially_paid", "paid", "void"]),
  issue_date: z.string(),
  due_date: z.string(),
  currency: z.string(),
  subject: z.string().nullable(),
  notes: z.string().nullable(),
  discount_rate: z.number(),
  tax_rate: z.number(),
  subtotal_cents: z.number(),
  discount_cents: z.number(),
  tax_cents: z.number(),
  total_cents: z.number(),
  amount_paid_cents: z.number(),
  client: z.object({ name: z.string(), email: z.string().nullable(), address: z.string().nullable() }),
  organization: z.object({
    name: z.string(),
    address: z.string(),
    logo_path: z.string().nullable(),
    timezone: z.string(),
  }),
  items: z.array(
    z.object({
      position: z.number(),
      description: z.string(),
      quantity: z.number(),
      unit_price_cents: z.number(),
      amount_cents: z.number(),
    }),
  ),
});

export type SharedInvoice = {
  invoice: InvoiceDocumentData;
  sender: InvoiceSender;
  timezone: string;
};

/**
 * Maps the RPC result; null (unknown token or draft) stays null.
 * `logoUrl` turns the storage path into a public URL (server-only helper, passed in).
 */
export function parseSharedInvoice(
  data: unknown,
  logoUrl: (path: string | null) => string | null,
): SharedInvoice | null {
  if (data === null || data === undefined) return null;
  const row = sharedInvoiceJson.parse(data);
  return {
    invoice: {
      number: row.number,
      status: row.status,
      issueDate: row.issue_date,
      dueDate: row.due_date,
      currency: row.currency,
      subject: row.subject,
      notes: row.notes,
      discountRate: row.discount_rate,
      taxRate: row.tax_rate,
      subtotalCents: row.subtotal_cents,
      discountCents: row.discount_cents,
      taxCents: row.tax_cents,
      totalCents: row.total_cents,
      amountPaidCents: row.amount_paid_cents,
      client: row.client,
      items: row.items.map((item) => ({
        key: String(item.position),
        description: item.description,
        quantity: item.quantity,
        unitPriceCents: item.unit_price_cents,
        amountCents: item.amount_cents,
      })),
    },
    sender: {
      name: row.organization.name,
      address: row.organization.address,
      logoUrl: logoUrl(row.organization.logo_path),
    },
    timezone: row.organization.timezone,
  };
}

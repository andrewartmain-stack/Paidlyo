import "server-only";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg, logoPublicUrl } from "@/features/organizations/queries";
import { invoiceIdSchema, shareTokenSchema, type InvoiceFilter } from "./schemas";
import { parseSharedInvoice, type SharedInvoice } from "./shared";
import { unbilledTotals, type UnbilledSummary } from "./unbilled";
import { displayStatus, type InvoiceDetail, type InvoiceListItem } from "./types";

/**
 * Invoices of the current organization, newest first. RLS limits this to owners/admins.
 * Reads the session — call inside a <Suspense> boundary.
 */
export async function listInvoices(filter: InvoiceFilter, today: string): Promise<InvoiceListItem[]> {
  const org = await getCurrentOrg();
  const supabase = await createClient();

  let query = supabase
    .from("invoices")
    .select(
      "id, number, status, issue_date, due_date, currency, total_cents, client:clients!invoices_client_fkey(id, name)",
    )
    .eq("organization_id", org.id);

  if (filter === "draft" || filter === "void" || filter === "paid") query = query.eq("status", filter);
  if (filter === "sent") query = query.in("status", ["sent", "partially_paid"]);
  if (filter === "overdue") query = query.in("status", ["sent", "partially_paid"]).lt("due_date", today);

  const { data, error } = await query
    .order("issue_date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw new Error("Could not load invoices.");

  return data.map((row) => ({
    id: row.id,
    number: row.number,
    status: row.status,
    displayStatus: displayStatus(row.status, row.due_date, today),
    issueDate: row.issue_date,
    dueDate: row.due_date,
    currency: row.currency,
    totalCents: row.total_cents,
    client: row.client,
  }));
}

/** One invoice with its client and lines, or a 404. */
export async function getInvoice(id: string, today: string): Promise<InvoiceDetail> {
  const invoiceId = invoiceIdSchema.safeParse(id);
  if (!invoiceId.success) notFound();

  const org = await getCurrentOrg();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("invoices")
    .select(
      `id, number, status, issue_date, due_date, currency, subject, notes, discount_rate, tax_rate,
       subtotal_cents, discount_cents, tax_cents, total_cents, amount_paid_cents, sent_at, updated_at,
       share_token,
       client:clients!invoices_client_fkey(id, name, email, address),
       invoice_items(id, position, kind, description, quantity, unit_price_cents, amount_cents),
       payments!payments_invoice_fkey(id, amount_cents, paid_at, method, notes, created_at)`,
    )
    .eq("id", invoiceId.data)
    .eq("organization_id", org.id)
    .maybeSingle();
  if (error) throw new Error("Could not load the invoice.");
  if (!data) notFound();

  return {
    id: data.id,
    number: data.number,
    status: data.status,
    displayStatus: displayStatus(data.status, data.due_date, today),
    issueDate: data.issue_date,
    dueDate: data.due_date,
    currency: data.currency,
    subject: data.subject,
    notes: data.notes,
    discountRate: Number(data.discount_rate),
    taxRate: Number(data.tax_rate),
    subtotalCents: data.subtotal_cents,
    discountCents: data.discount_cents,
    taxCents: data.tax_cents,
    totalCents: data.total_cents,
    amountPaidCents: data.amount_paid_cents,
    sentAt: data.sent_at,
    updatedAt: data.updated_at,
    shareToken: data.share_token,
    client: data.client,
    items: [...data.invoice_items]
      .sort((a, b) => a.position - b.position)
      .map((item) => ({
        id: item.id,
        kind: item.kind,
        description: item.description,
        quantity: Number(item.quantity),
        unitPriceCents: item.unit_price_cents,
        amountCents: item.amount_cents,
      })),
    payments: [...data.payments]
      .sort((a, b) => a.paid_at.localeCompare(b.paid_at) || a.created_at.localeCompare(b.created_at))
      .map((p) => ({
        id: p.id,
        amountCents: p.amount_cents,
        paidAt: p.paid_at,
        method: p.method,
        notes: p.notes,
      })),
  };
}

/**
 * Unbilled billable time per client (owners/admins see the whole org's time via RLS).
 * Running timers and empty entries are excluded, matching add_time_to_invoice.
 */
export async function getUnbilledByClient(): Promise<Map<string, UnbilledSummary>> {
  const org = await getCurrentOrg();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("time_entries")
    .select("minutes, hourly_rate_cents, project:projects!time_entries_project_fkey(client_id)")
    .eq("organization_id", org.id)
    .eq("is_billable", true)
    .is("invoice_item_id", null)
    .is("timer_started_at", null)
    .gt("minutes", 0);
  if (error) throw new Error("Could not load unbilled time.");

  return unbilledTotals(
    data.map((row) => ({
      clientId: row.project.client_id,
      minutes: row.minutes,
      hourlyRateCents: row.hourly_rate_cents,
    })),
  );
}

/**
 * The client link's invoice (no login). null for unknown tokens and drafts.
 * Works for anonymous visitors through the security definer RPC get_shared_invoice.
 */
export async function getSharedInvoice(token: string): Promise<SharedInvoice | null> {
  const shareToken = shareTokenSchema.safeParse(token);
  if (!shareToken.success) return null;

  // Public page with no getCurrentUser() call: mark it request-time here, otherwise the
  // Supabase client's session check (Date.now()) runs during prerendering.
  await connection();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_shared_invoice", { p_token: shareToken.data });
  if (error) throw new Error("Could not load the invoice.");
  return parseSharedInvoice(data, logoPublicUrl);
}

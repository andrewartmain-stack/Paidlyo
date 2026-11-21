import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { MoneyByCurrency } from "@/features/reports/aggregate";
import { listOpenInvoices, listUnbilledEntries } from "@/features/reports/queries";
import { toOutstanding } from "@/features/reports/outstanding";
import { groupUnbilled } from "@/features/reports/unbilled";
import { addDays, weekStart } from "@/features/time/dates";
import { listMyEntries } from "@/features/time/queries";
import type { CurrentOrg } from "@/features/organizations/types";
import type { InvoiceListItem } from "@/features/invoices/types";
import { displayStatus } from "@/features/invoices/types";
import type { SetupCounts } from "./compute";

/** Days of the user's own time loaded for the week chart and the recent entries. */
const RECENT_DAYS = 30;

/** The signed-in user's entries from the last 30 days through the end of this week (deduped per request). */
export const getMyRecentEntries = cache(async (today: string) => {
  const from = addDays(today, -RECENT_DAYS);
  const start = weekStart(today);
  return listMyEntries(from < start ? from : start, addDays(start, 6));
});

/** Unbilled time and open invoices (owners/admins), shared by the cards and "Needs attention". */
export const getMoneyOverview = cache(async (org: CurrentOrg, today: string) => {
  const [unbilled, open] = await Promise.all([listUnbilledEntries(org), listOpenInvoices(org)]);
  return {
    unbilledClients: groupUnbilled(unbilled.entries),
    outstanding: toOutstanding(open.invoices, today),
  };
});

async function countRows(
  table: "clients" | "projects" | "time_entries" | "invoices",
  orgId: string,
  sentOnly = false,
): Promise<number> {
  const supabase = await createClient();
  let query = supabase.from(table).select("id", { count: "exact", head: true }).eq("organization_id", orgId);
  if (sentOnly) query = query.in("status", ["sent", "partially_paid", "paid"]);
  const { count } = await query;
  return count ?? 0;
}

/** How far a new organization is with setting up (owners/admins). */
export async function getSetupCounts(orgId: string): Promise<SetupCounts> {
  const [clients, projects, timeEntries, sentInvoices] = await Promise.all([
    countRows("clients", orgId),
    countRows("projects", orgId),
    countRows("time_entries", orgId),
    countRows("invoices", orgId, true),
  ]);
  return { clients, projects, timeEntries, sentInvoices };
}

/** Payments recorded from `from` (inclusive) through `to`, per invoice currency. */
export async function getPaidBetween(orgId: string, from: string, to: string): Promise<MoneyByCurrency> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payments")
    .select("amount_cents, invoice:invoices!payments_invoice_fkey(currency)")
    .eq("organization_id", orgId)
    .gte("paid_at", from)
    .lte("paid_at", to);
  if (error) throw new Error("Could not load payments.");

  const paid: MoneyByCurrency = {};
  for (const row of data) {
    paid[row.invoice.currency] = (paid[row.invoice.currency] ?? 0) + row.amount_cents;
  }
  return paid;
}

/** The latest invoices (owners/admins). */
export async function listRecentInvoices(orgId: string, today: string, limit = 5): Promise<InvoiceListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("invoices")
    .select("id, number, status, issue_date, due_date, currency, total_cents, client:clients!invoices_client_fkey(id, name)")
    .eq("organization_id", orgId)
    .order("issue_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);
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

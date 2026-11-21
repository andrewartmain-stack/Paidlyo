import "server-only";
import { fetchAllRows } from "@/lib/supabase/fetch-all";
import { createClient } from "@/lib/supabase/server";
import type { CurrentOrg } from "@/features/organizations/types";
import type { ReportEntry } from "./aggregate";
import type { OpenInvoice } from "./outstanding";
import type { ReportRange } from "./periods";
import type { UnbilledEntry } from "./unbilled";

/*
 * Report queries. Owners/admins only: callers check canManageOrg (RLS would show members just
 * their own time and no invoices).
 */

/** Safety cap: beyond this the report asks for a shorter period. */
export const MAX_REPORT_ENTRIES = 50_000;

const ENTRY_COLUMNS = `id, user_id, spent_date, minutes, notes, is_billable, hourly_rate_cents, timer_started_at,
  invoice_item_id,
  project:projects!time_entries_project_fkey(id, name, client:clients!projects_client_fkey(id, name, currency)),
  task:tasks!time_entries_task_fkey(id, name)`;

export type ReportData = { entries: ReportEntry[]; truncated: boolean };

/** All of the organization's time entries in the range, oldest first. */
export async function listReportEntries(org: CurrentOrg, range: ReportRange): Promise<ReportData> {
  const supabase = await createClient();
  const { rows, truncated } = await fetchAllRows((from, to) =>
    supabase
      .from("time_entries")
      .select(ENTRY_COLUMNS)
      .eq("organization_id", org.id)
      .gte("spent_date", range.from)
      .lte("spent_date", range.to)
      .order("spent_date")
      .order("created_at")
      .order("id")
      .range(from, to),
    MAX_REPORT_ENTRIES,
  );

  const userIds = [...new Set(rows.map((row) => row.user_id))];
  const names = new Map<string, string>();
  if (userIds.length > 0) {
    const { data: profiles, error } = await supabase.from("profiles").select("id, full_name, email").in("id", userIds);
    if (error) throw new Error("Could not load the report.");
    for (const profile of profiles) names.set(profile.id, profile.full_name.trim() || profile.email);
  }

  const entries = rows.map(
    (row): ReportEntry => ({
      id: row.id,
      spentDate: row.spent_date,
      minutes: row.minutes,
      notes: row.notes,
      isBillable: row.is_billable,
      hourlyRateCents: row.hourly_rate_cents,
      invoiced: row.invoice_item_id !== null,
      timerRunning: row.timer_started_at !== null,
      personName: names.get(row.user_id) ?? "",
      client: row.project.client,
      project: { id: row.project.id, name: row.project.name },
      task: row.task,
    }),
  );

  return { entries, truncated };
}

/**
 * Billable time not on any invoice, across all dates. Running timers and empty entries are
 * left out, matching add_time_to_invoice.
 */
export async function listUnbilledEntries(org: CurrentOrg): Promise<{ entries: UnbilledEntry[]; truncated: boolean }> {
  const supabase = await createClient();
  const { rows, truncated } = await fetchAllRows((from, to) =>
    supabase
      .from("time_entries")
      .select(
        "id, spent_date, minutes, hourly_rate_cents, project:projects!time_entries_project_fkey(id, name, client:clients!projects_client_fkey(id, name, currency))",
      )
      .eq("organization_id", org.id)
      .eq("is_billable", true)
      .is("invoice_item_id", null)
      .is("timer_started_at", null)
      .gt("minutes", 0)
      .order("spent_date")
      .order("id")
      .range(from, to),
    MAX_REPORT_ENTRIES,
  );

  const entries = rows.map(
    (row): UnbilledEntry => ({
      spentDate: row.spent_date,
      minutes: row.minutes,
      hourlyRateCents: row.hourly_rate_cents,
      client: row.project.client,
      project: { id: row.project.id, name: row.project.name },
    }),
  );
  return { entries, truncated };
}

/** Sent and partly paid invoices. */
export async function listOpenInvoices(org: CurrentOrg): Promise<{ invoices: OpenInvoice[]; truncated: boolean }> {
  const supabase = await createClient();
  const { rows, truncated } = await fetchAllRows((from, to) =>
    supabase
      .from("invoices")
      .select(
        "id, number, issue_date, due_date, currency, total_cents, amount_paid_cents, client:clients!invoices_client_fkey(id, name)",
      )
      .eq("organization_id", org.id)
      .in("status", ["sent", "partially_paid"])
      .order("due_date")
      .order("id")
      .range(from, to),
    MAX_REPORT_ENTRIES,
  );

  const invoices = rows.map(
    (row): OpenInvoice => ({
      id: row.id,
      number: row.number,
      client: row.client,
      issueDate: row.issue_date,
      dueDate: row.due_date,
      currency: row.currency,
      totalCents: row.total_cents,
      amountPaidCents: row.amount_paid_cents,
    }),
  );
  return { invoices, truncated };
}

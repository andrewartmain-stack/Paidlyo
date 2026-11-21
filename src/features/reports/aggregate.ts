import { formatMoney } from "@/lib/money";
import { lineAmountCents } from "@/features/invoices/totals";
import type { ReportGroup } from "./schemas";

/** One time entry as the reports see it. */
export type ReportEntry = {
  id: string;
  spentDate: string;
  minutes: number;
  notes: string | null;
  isBillable: boolean;
  hourlyRateCents: number | null;
  invoiced: boolean;
  timerRunning: boolean;
  personName: string;
  client: { id: string; name: string; currency: string };
  project: { id: string; name: string };
  task: { id: string; name: string };
};

/** Amounts per currency (clients can be billed in different currencies; never add them up). */
export type MoneyByCurrency = Record<string, number>;

/**
 * Billable amount of one entry: hours rounded to 0.01 × rate, the same estimate as the
 * unbilled-time totals. Invoices group entries before rounding, so they can differ by cents.
 */
export function entryAmountCents(entry: Pick<ReportEntry, "minutes" | "isBillable" | "hourlyRateCents">): number {
  if (!entry.isBillable || !entry.hourlyRateCents) return 0;
  const hours = Math.round((entry.minutes / 60) * 100) / 100;
  return lineAmountCents(hours, entry.hourlyRateCents);
}

function addMoney(money: MoneyByCurrency, currency: string, cents: number) {
  if (cents === 0) return;
  money[currency] = (money[currency] ?? 0) + cents;
}

export type ReportSummary = {
  minutes: number;
  billableMinutes: number;
  billableAmount: MoneyByCurrency;
  unbilledAmount: MoneyByCurrency;
};

export function summarize(entries: ReportEntry[]): ReportSummary {
  const summary: ReportSummary = { minutes: 0, billableMinutes: 0, billableAmount: {}, unbilledAmount: {} };
  for (const entry of entries) {
    summary.minutes += entry.minutes;
    if (!entry.isBillable) continue;
    summary.billableMinutes += entry.minutes;
    const amount = entryAmountCents(entry);
    addMoney(summary.billableAmount, entry.client.currency, amount);
    if (!entry.invoiced) addMoney(summary.unbilledAmount, entry.client.currency, amount);
  }
  return summary;
}

export type ReportGroupRow = {
  key: string;
  label: string;
  /** Extra context, e.g. the client of a project. */
  detail: string | null;
  minutes: number;
  billableMinutes: number;
  amount: MoneyByCurrency;
};

function groupKey(entry: ReportEntry, group: ReportGroup): Pick<ReportGroupRow, "key" | "label" | "detail"> {
  switch (group) {
    case "client":
      return { key: entry.client.id, label: entry.client.name, detail: null };
    case "project":
      return { key: entry.project.id, label: entry.project.name, detail: entry.client.name };
    case "task":
      return { key: entry.task.id, label: entry.task.name, detail: null };
  }
}

/** Hours and billable amounts per client / project / task, most hours first. */
export function groupEntries(entries: ReportEntry[], group: ReportGroup): ReportGroupRow[] {
  const rows = new Map<string, ReportGroupRow>();
  for (const entry of entries) {
    const id = groupKey(entry, group);
    const row = rows.get(id.key) ?? { ...id, minutes: 0, billableMinutes: 0, amount: {} };
    row.minutes += entry.minutes;
    if (entry.isBillable) {
      row.billableMinutes += entry.minutes;
      addMoney(row.amount, entry.client.currency, entryAmountCents(entry));
    }
    rows.set(id.key, row);
  }
  return [...rows.values()].sort((a, b) => b.minutes - a.minutes || a.label.localeCompare(b.label));
}

/** "$1,200.00 · €800.00"; `fallbackCurrency` formats an empty total as zero. */
export function formatMoneyTotals(money: MoneyByCurrency, fallbackCurrency: string): string {
  const currencies = Object.keys(money).sort();
  if (currencies.length === 0) return formatMoney(0, fallbackCurrency);
  return currencies.map((currency) => formatMoney(money[currency], currency)).join(" · ");
}

/** Share of `part` in `total` as a whole percentage (0 when there's no total). */
export function percentOf(part: number, total: number): number {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

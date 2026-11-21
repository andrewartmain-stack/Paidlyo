/* Dashboard calculations (pure, shared by the page and tests). */
import { formatWeekday } from "@/features/time/dates";
import type { OutstandingInvoice } from "@/features/reports/outstanding";
import type { UnbilledClientRow } from "@/features/reports/unbilled";

// ---------------------------------------------------------------------------
// Greeting
// ---------------------------------------------------------------------------

/** Hour of day (0–23) in the organization's timezone. */
export function hourIn(timeZone: string, now: Date): number {
  const hour = new Intl.DateTimeFormat("en-US", { hour: "numeric", hourCycle: "h23", timeZone }).format(now);
  return Number(hour) % 24;
}

export function greeting(hour: number): string {
  if (hour < 5) return "Good evening";
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? "";
}

// ---------------------------------------------------------------------------
// Getting started checklist
// ---------------------------------------------------------------------------

export type SetupCounts = { clients: number; projects: number; timeEntries: number; sentInvoices: number };

export type ChecklistStep = { key: string; label: string; href: string; done: boolean };

export function checklistSteps(counts: SetupCounts): ChecklistStep[] {
  return [
    { key: "workspace", label: "Create your workspace", href: "/app/settings", done: true },
    { key: "client", label: "Add a client", href: "/app/clients", done: counts.clients > 0 },
    { key: "project", label: "Create a project", href: "/app/projects/new", done: counts.projects > 0 },
    { key: "time", label: "Track your first hour", href: "/app/time?track=1", done: counts.timeEntries > 0 },
    { key: "invoice", label: "Send your first invoice", href: "/app/invoices/new", done: counts.sentInvoices > 0 },
  ];
}

export function checklistDone(steps: ChecklistStep[]): boolean {
  return steps.every((step) => step.done);
}

// ---------------------------------------------------------------------------
// This week chart
// ---------------------------------------------------------------------------

export type WeekBar = { date: string; label: string; minutes: number; heightPct: number; isToday: boolean; isFuture: boolean };

/** One bar per day; heights relative to the busiest day (or an 8-hour day, whichever is larger). */
export function weekBars(days: string[], minutesByDate: Map<string, number>, today: string): WeekBar[] {
  const max = Math.max(8 * 60, ...days.map((day) => minutesByDate.get(day) ?? 0));
  return days.map((date) => {
    const minutes = minutesByDate.get(date) ?? 0;
    return {
      date,
      label: formatWeekday(date),
      minutes,
      heightPct: Math.round((minutes / max) * 100),
      isToday: date === today,
      isFuture: date > today,
    };
  });
}

// ---------------------------------------------------------------------------
// Needs attention
// ---------------------------------------------------------------------------

export type AttentionItem =
  | { kind: "timer"; entryId: string; label: string; startedAt: string }
  | { kind: "overdue"; invoiceId: string; number: string; clientName: string; daysOverdue: number; balanceCents: number; currency: string }
  | { kind: "unbilled"; clientId: string; clientName: string; amountCents: number; minutes: number; currency: string };

export const MAX_ATTENTION_ITEMS = 5;

/**
 * What to act on now: a running timer first, then overdue invoices (most overdue first), then
 * clients with unbilled time (oldest first). Capped so the card stays short.
 */
export function attentionItems(input: {
  runningTimer: { entryId: string; label: string; startedAt: string } | null;
  outstanding: OutstandingInvoice[];
  unbilledClients: UnbilledClientRow[];
}): AttentionItem[] {
  const items: AttentionItem[] = [];
  if (input.runningTimer) items.push({ kind: "timer", ...input.runningTimer });

  for (const invoice of input.outstanding) {
    if (invoice.daysOverdue <= 0) continue;
    items.push({
      kind: "overdue",
      invoiceId: invoice.id,
      number: invoice.number,
      clientName: invoice.client.name,
      daysOverdue: invoice.daysOverdue,
      balanceCents: invoice.balanceCents,
      currency: invoice.currency,
    });
  }

  for (const client of input.unbilledClients) {
    if (client.amountCents <= 0) continue;
    items.push({
      kind: "unbilled",
      clientId: client.id,
      clientName: client.name,
      amountCents: client.amountCents,
      minutes: client.minutes,
      currency: client.currency,
    });
  }

  return items.slice(0, MAX_ATTENTION_ITEMS);
}

/** First day of the month of an ISO date. */
export function monthStart(iso: string): string {
  return `${iso.slice(0, 7)}-01`;
}

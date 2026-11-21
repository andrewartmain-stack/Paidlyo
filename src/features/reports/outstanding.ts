import { balanceDueCents } from "@/features/invoices/document";
import type { MoneyByCurrency } from "./aggregate";

export const AGING_BUCKETS = [
  { value: "current", label: "Not yet due" },
  { value: "1_30", label: "1–30 days overdue" },
  { value: "31_60", label: "31–60 days overdue" },
  { value: "61_90", label: "61–90 days overdue" },
  { value: "over_90", label: "Over 90 days overdue" },
] as const;
export type AgingBucket = (typeof AGING_BUCKETS)[number]["value"];

/** Days past the due date (0 or less = not overdue; due today is not overdue). */
export function daysOverdue(dueDate: string, today: string): number {
  return Math.round((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${dueDate}T00:00:00Z`)) / 86_400_000);
}

export function agingBucket(days: number): AgingBucket {
  if (days <= 0) return "current";
  if (days <= 30) return "1_30";
  if (days <= 60) return "31_60";
  if (days <= 90) return "61_90";
  return "over_90";
}

/** A sent or partly paid invoice as stored. */
export type OpenInvoice = {
  id: string;
  number: string;
  client: { id: string; name: string };
  issueDate: string;
  dueDate: string;
  currency: string;
  totalCents: number;
  amountPaidCents: number;
};

export type OutstandingInvoice = OpenInvoice & { balanceCents: number; daysOverdue: number; bucket: AgingBucket };

/** Balance and age of each open invoice; most overdue first, fully paid ones left out. */
export function toOutstanding(invoices: OpenInvoice[], today: string): OutstandingInvoice[] {
  return invoices
    .map((invoice) => {
      const days = daysOverdue(invoice.dueDate, today);
      return {
        ...invoice,
        balanceCents: balanceDueCents(invoice.totalCents, invoice.amountPaidCents),
        daysOverdue: days,
        bucket: agingBucket(days),
      };
    })
    .filter((invoice) => invoice.balanceCents > 0)
    .sort((a, b) => b.daysOverdue - a.daysOverdue || a.number.localeCompare(b.number));
}

export type AgingSummary = { total: MoneyByCurrency; buckets: Record<AgingBucket, MoneyByCurrency> };

/** Balance due per aging bucket and in total, per currency. */
export function agingSummary(invoices: OutstandingInvoice[]): AgingSummary {
  const summary: AgingSummary = {
    total: {},
    buckets: { current: {}, "1_30": {}, "31_60": {}, "61_90": {}, over_90: {} },
  };
  for (const invoice of invoices) {
    const bucket = summary.buckets[invoice.bucket];
    bucket[invoice.currency] = (bucket[invoice.currency] ?? 0) + invoice.balanceCents;
    summary.total[invoice.currency] = (summary.total[invoice.currency] ?? 0) + invoice.balanceCents;
  }
  return summary;
}

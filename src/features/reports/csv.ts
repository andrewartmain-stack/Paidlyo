import { entryAmountCents, type ReportEntry } from "./aggregate";
import { AGING_BUCKETS, type OutstandingInvoice } from "./outstanding";
import type { UnbilledClientRow } from "./unbilled";

type Cell = string | number | boolean | null;

/**
 * One CSV cell (RFC 4180). Text starting with = + - @ (or a tab / carriage return) gets a
 * leading ' so spreadsheets don't run it as a formula. Numbers are written as-is.
 */
export function csvCell(value: Cell): string {
  if (value === null) return "";
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "Yes" : "No";
  let text = value;
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  if (/[",\r\n]/.test(text)) text = `"${text.replaceAll('"', '""')}"`;
  return text;
}

/** The whole file, with a UTF-8 BOM so Excel shows accents correctly. */
export function toCsv(rows: Cell[][]): string {
  return `﻿${rows.map((row) => row.map(csvCell).join(",")).join("\r\n")}\r\n`;
}

/** 12050 → "120.50" (exact, no floating point). */
export function centsToDecimal(cents: number): string {
  return `${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, "0")}`;
}

/** 90 minutes → 1.5 (decimal hours, 2 places). */
function decimalHours(minutes: number): number {
  return Math.round((minutes / 60) * 100) / 100;
}

export const TIME_CSV_HEADER = [
  "Date",
  "Client",
  "Project",
  "Task",
  "Person",
  "Notes",
  "Hours",
  "Billable",
  "Rate",
  "Amount",
  "Currency",
  "Invoiced",
];

/** One row per time entry. */
export function timeEntriesCsv(entries: ReportEntry[]): string {
  const rows: Cell[][] = entries.map((entry) => [
    entry.spentDate,
    entry.client.name,
    entry.project.name,
    entry.task.name,
    entry.personName,
    entry.notes,
    decimalHours(entry.minutes),
    entry.isBillable,
    entry.isBillable && entry.hourlyRateCents !== null ? centsToDecimal(entry.hourlyRateCents) : null,
    entry.isBillable ? centsToDecimal(entryAmountCents(entry)) : null,
    entry.client.currency,
    entry.invoiced,
  ]);
  return toCsv([TIME_CSV_HEADER, ...rows]);
}

/** One row per client and project with unbilled time. */
export function unbilledCsv(clients: UnbilledClientRow[]): string {
  const rows: Cell[][] = clients.flatMap((client) =>
    client.projects.map((project) => [
      client.name,
      project.name,
      decimalHours(project.minutes),
      centsToDecimal(project.amountCents),
      client.currency,
      project.oldestDate,
    ]),
  );
  return toCsv([["Client", "Project", "Hours", "Estimated amount", "Currency", "Oldest entry"], ...rows]);
}

/** One row per outstanding invoice. */
export function outstandingCsv(invoices: OutstandingInvoice[]): string {
  const rows: Cell[][] = invoices.map((invoice) => [
    invoice.number,
    invoice.client.name,
    invoice.issueDate,
    invoice.dueDate,
    Math.max(0, invoice.daysOverdue),
    AGING_BUCKETS.find((b) => b.value === invoice.bucket)?.label ?? "",
    centsToDecimal(invoice.totalCents),
    centsToDecimal(invoice.amountPaidCents),
    centsToDecimal(invoice.balanceCents),
    invoice.currency,
  ]);
  return toCsv([
    ["Invoice", "Client", "Issue date", "Due date", "Days overdue", "Age", "Total", "Paid", "Balance due", "Currency"],
    ...rows,
  ]);
}

/* Project budget usage (pure, shared by the projects list, project page, dashboard and tests). */
import { entryAmountCents } from "@/features/reports/aggregate";
import { liveMinutes } from "@/features/time/duration";
import { formatMoney } from "@/lib/money";
import { minutesToHours } from "./schemas";

/** From this share of the budget a project shows a warning (and appears in "Needs attention"). */
export const BUDGET_WARNING_PCT = 80;

export type BudgetUsage = { minutes: number; amountCents: number };

export type BudgetStatus = "ok" | "warning" | "over";

export type BudgetProgress = {
  kind: "hours" | "amount";
  /** Minutes (hours budget) or cents (amount budget). */
  used: number;
  total: number;
  /** Whole percent used, not capped (e.g. 115 when over). */
  pct: number;
  status: BudgetStatus;
};

export type UsageEntry = {
  projectId: string;
  minutes: number;
  timerStartedAt: string | null;
  isBillable: boolean;
  hourlyRateCents: number | null;
};

/**
 * Minutes (all time, running timers included) and billable amount (at each entry's saved rate,
 * like invoices) per project.
 */
export function sumUsage(entries: UsageEntry[], nowMs: number): Map<string, BudgetUsage> {
  const usage = new Map<string, BudgetUsage>();
  for (const entry of entries) {
    const minutes = liveMinutes(entry.minutes, entry.timerStartedAt, nowMs);
    const row = usage.get(entry.projectId) ?? { minutes: 0, amountCents: 0 };
    row.minutes += minutes;
    row.amountCents += entryAmountCents({ minutes, isBillable: entry.isBillable, hourlyRateCents: entry.hourlyRateCents });
    usage.set(entry.projectId, row);
  }
  return usage;
}

export function budgetStatus(pct: number): BudgetStatus {
  if (pct > 100) return "over";
  if (pct >= BUDGET_WARNING_PCT) return "warning";
  return "ok";
}

/** Progress against the project's budget; null when it has none. */
export function budgetProgress(
  project: { budgetMinutes: number | null; budgetCents: number | null },
  usage: BudgetUsage | undefined,
): BudgetProgress | null {
  const used = usage ?? { minutes: 0, amountCents: 0 };
  let kind: BudgetProgress["kind"];
  let total: number;
  let spent: number;
  if (project.budgetMinutes !== null && project.budgetMinutes > 0) {
    kind = "hours";
    total = project.budgetMinutes;
    spent = used.minutes;
  } else if (project.budgetCents !== null && project.budgetCents > 0) {
    kind = "amount";
    total = project.budgetCents;
    spent = used.amountCents;
  } else {
    return null;
  }
  const pct = Math.floor((spent / total) * 100);
  return { kind, used: spent, total, pct, status: budgetStatus(pct) };
}

function formatValue(progress: BudgetProgress, value: number, currency: string): string {
  return progress.kind === "hours" ? `${minutesToHours(value)} h` : formatMoney(value, currency);
}

/** "32 of 40 h" / "$3,200.00 of $4,000.00". */
export function budgetLabel(progress: BudgetProgress, currency: string): string {
  if (progress.kind === "hours") return `${minutesToHours(progress.used)} of ${minutesToHours(progress.total)} h`;
  return `${formatValue(progress, progress.used, currency)} of ${formatValue(progress, progress.total, currency)}`;
}

/** "80% used", "Over by 6 h". */
export function budgetDetail(progress: BudgetProgress, currency: string): string {
  if (progress.used > progress.total) {
    return `Over by ${formatValue(progress, progress.used - progress.total, currency)}`;
  }
  return `${progress.pct}% used`;
}

import { formatMoney } from "@/lib/money";
import { formatDuration } from "@/features/time/duration";
import { lineAmountCents } from "./totals";

export type UnbilledSummary = { minutes: number; amountCents: number };

/**
 * Sums unbilled entries per client. The amount is an estimate (per entry, hours rounded to
 * 0.01); the invoice groups entries before rounding, so totals can differ by a few cents.
 */
export function unbilledTotals(
  entries: { clientId: string; minutes: number; hourlyRateCents: number | null }[],
): Map<string, UnbilledSummary> {
  const totals = new Map<string, UnbilledSummary>();
  for (const entry of entries) {
    const current = totals.get(entry.clientId) ?? { minutes: 0, amountCents: 0 };
    const hours = Math.round((entry.minutes / 60) * 100) / 100;
    current.minutes += entry.minutes;
    current.amountCents += lineAmountCents(hours, entry.hourlyRateCents ?? 0);
    totals.set(entry.clientId, current);
  }
  return totals;
}

/** "12:30 unbilled (≈ $1,500.00)", or null when there's nothing unbilled. */
export function unbilledLabel(summary: UnbilledSummary | undefined, currency: string): string | null {
  if (!summary || summary.minutes === 0) return null;
  return `${formatDuration(summary.minutes)} unbilled (≈ ${formatMoney(summary.amountCents, currency)})`;
}

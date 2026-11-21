/** Display helpers for the invoice document (preview / PDF, later the client link). */

/** Quantity as shown on the invoice: up to 2 decimals, no trailing zeros ("1.5", "2", "0.25"). */
export function formatQuantity(quantity: number): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(quantity);
}

/** Percentage label without trailing zeros ("10", "7.5"). */
export function formatRate(rate: number): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 3 }).format(rate);
}

/** What the client still owes; never negative. */
export function balanceDueCents(totalCents: number, amountPaidCents: number): number {
  return Math.max(0, totalCents - amountPaidCents);
}

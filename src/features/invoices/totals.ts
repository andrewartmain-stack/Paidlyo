/*
 * Invoice math in integer cents. Mirrors public.recalculate_invoice_totals / save_invoice in
 * supabase/migrations/*_create_invoices.sql — keep the two in sync. The stored (server) totals
 * are authoritative; this powers the live preview in the editor.
 *
 * All values are non-negative, so "round half away from zero" = floor(x + ½).
 * BigInt avoids precision loss on large subtotals × rates.
 */

/** Rounds numerator / denominator to the nearest integer, halves up (non-negative inputs). */
const TWO = BigInt(2);
const HUNDRED = BigInt(100);
const TEN_THOUSAND = BigInt(10_000);

function divRound(numerator: bigint, denominator: bigint): bigint {
  return (numerator * TWO + denominator) / (denominator * TWO);
}

/** "1.5" → 150 (hundredths); quantities and percentages have at most 2 decimals. */
export function toHundredths(value: number): bigint {
  return BigInt(Math.round(value * 100));
}

/** Line amount = round(quantity × unit price). */
export function lineAmountCents(quantity: number, unitPriceCents: number): number {
  return Number(divRound(toHundredths(quantity) * BigInt(unitPriceCents), HUNDRED));
}

export type InvoiceTotals = {
  subtotalCents: number;
  discountCents: number;
  taxCents: number;
  totalCents: number;
};

export function invoiceTotals(
  lines: { quantity: number; unitPriceCents: number }[],
  discountRate: number,
  taxRate: number,
): InvoiceTotals {
  const subtotal = lines.reduce(
    (sum, line) => sum + BigInt(lineAmountCents(line.quantity, line.unitPriceCents)),
    BigInt(0),
  );
  const discount = divRound(subtotal * toHundredths(discountRate), TEN_THOUSAND);
  const tax = divRound((subtotal - discount) * toHundredths(taxRate), TEN_THOUSAND);
  return {
    subtotalCents: Number(subtotal),
    discountCents: Number(discount),
    taxCents: Number(tax),
    totalCents: Number(subtotal - discount + tax),
  };
}

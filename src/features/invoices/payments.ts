import type { Enums } from "@/types/database";
import type { InvoiceStatus } from "./types";

export type PaymentMethod = Enums<"payment_method">;

/** Methods offered when recording a payment by hand ("stripe" is set by item 10b only). */
export const MANUAL_PAYMENT_METHODS = ["bank_transfer", "cash", "card", "paypal", "check", "other"] as const;

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  bank_transfer: "Bank transfer",
  cash: "Cash",
  card: "Card",
  paypal: "PayPal",
  check: "Check",
  stripe: "Stripe",
  other: "Other",
};

/** Status of a sent invoice from its payments. Mirrors apply_invoice_payments in SQL. */
export function statusAfterPayments(totalCents: number, paidCents: number): InvoiceStatus {
  if (paidCents > 0 && paidCents >= totalCents) return "paid";
  if (paidCents > 0) return "partially_paid";
  return "sent";
}

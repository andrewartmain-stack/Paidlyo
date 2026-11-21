import { addDays } from "@/features/time/dates";

export const PAYMENT_TERMS = [
  { value: "receipt", label: "Due on receipt", days: 0 },
  { value: "net15", label: "Net 15", days: 15 },
  { value: "net30", label: "Net 30", days: 30 },
  { value: "net45", label: "Net 45", days: 45 },
  { value: "net60", label: "Net 60", days: 60 },
  { value: "custom", label: "Custom date", days: null },
] as const;

export type PaymentTerm = (typeof PAYMENT_TERMS)[number]["value"];
export const PAYMENT_TERM_VALUES = PAYMENT_TERMS.map((t) => t.value) as [PaymentTerm, ...PaymentTerm[]];

/** Due date for a preset term, or null for "custom". */
export function dueDateForTerm(issueDate: string, term: PaymentTerm): string | null {
  const days = PAYMENT_TERMS.find((t) => t.value === term)?.days;
  return days == null ? null : addDays(issueDate, days);
}

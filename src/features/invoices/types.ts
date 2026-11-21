import type { Enums } from "@/types/database";
import type { PaymentMethod } from "./payments";

export type InvoiceStatus = Enums<"invoice_status">;
/** Status shown to people: a sent invoice past its due date is "overdue". */
export type DisplayStatus = InvoiceStatus | "overdue";

export type InvoiceListItem = {
  id: string;
  number: string;
  status: InvoiceStatus;
  displayStatus: DisplayStatus;
  issueDate: string;
  dueDate: string;
  currency: string;
  totalCents: number;
  client: { id: string; name: string };
};

export type InvoiceLine = {
  id: string;
  kind: Enums<"invoice_item_kind">;
  description: string;
  quantity: number;
  unitPriceCents: number;
  amountCents: number;
};

export type InvoiceDetail = Omit<InvoiceListItem, "client"> & {
  subject: string | null;
  notes: string | null;
  discountRate: number;
  taxRate: number;
  subtotalCents: number;
  discountCents: number;
  taxCents: number;
  amountPaidCents: number;
  sentAt: string | null;
  /** Changes on every save; used to reset the editor to the saved state. */
  updatedAt: string;
  /** Secret token of the client link /i/<token>. */
  shareToken: string;
  client: { id: string; name: string; email: string | null; address: string | null };
  items: InvoiceLine[];
  /** Oldest first. */
  payments: Payment[];
};

export type Payment = {
  id: string;
  amountCents: number;
  paidAt: string;
  method: PaymentMethod;
  notes: string | null;
};

/** Who the invoice is from (the organization), as printed on it. */
export type InvoiceSender = {
  name: string;
  address: string;
  logoUrl: string | null;
};

/** What the invoice document prints: shared by the preview page and the client link. */
export type InvoiceDocumentData = Pick<
  InvoiceDetail,
  | "number"
  | "status"
  | "issueDate"
  | "dueDate"
  | "currency"
  | "subject"
  | "notes"
  | "discountRate"
  | "taxRate"
  | "subtotalCents"
  | "discountCents"
  | "taxCents"
  | "totalCents"
  | "amountPaidCents"
> & {
  client: { name: string; email: string | null; address: string | null };
  items: { key: string; description: string; quantity: number; unitPriceCents: number; amountCents: number }[];
};

export function displayStatus(status: InvoiceStatus, dueDate: string, today: string): DisplayStatus {
  const open = status === "sent" || status === "partially_paid";
  return open && dueDate < today ? "overdue" : status;
}

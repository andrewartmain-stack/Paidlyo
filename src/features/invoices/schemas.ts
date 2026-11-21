import { z } from "zod";
import { MAX_AMOUNT_CENTS, optionalText, percentInput } from "@/lib/form-schemas";
import { MANUAL_PAYMENT_METHODS } from "./payments";
import { toCents } from "@/lib/money";
import { isoDateSchema } from "@/features/time/schemas";
import { PAYMENT_TERM_VALUES, dueDateForTerm } from "./terms";

const MAX_LINES = 200;
const MAX_UNIT_PRICE_CENTS = 10_000_000_000; // 100M
const MAX_QUANTITY = 1_000_000;

export const invoiceIdSchema = z.uuid();
/** Token in the client link /i/<token>. */
export const shareTokenSchema = z.uuid();

/** New invoice form: client + issue date + terms (or a custom due date). */
export const newInvoiceSchema = z
  .object({
    clientId: z.uuid("Choose a client."),
    issueDate: isoDateSchema,
    terms: z.enum(PAYMENT_TERM_VALUES, "Choose payment terms."),
    dueDate: z.string().optional(),
  })
  .transform((v, ctx) => {
    const dueDate = dueDateForTerm(v.issueDate, v.terms) ?? v.dueDate ?? "";
    if (!isoDateSchema.safeParse(dueDate).success) {
      ctx.addIssue({ code: "custom", path: ["dueDate"], message: "Choose a due date." });
      return z.NEVER;
    }
    if (dueDate < v.issueDate) {
      ctx.addIssue({ code: "custom", path: ["dueDate"], message: "The due date can't be before the issue date." });
      return z.NEVER;
    }
    return { clientId: v.clientId, issueDate: v.issueDate, dueDate };
  });

const quantity = z
  .string()
  .trim()
  .transform((v) => v.replace(",", "."))
  .pipe(
    z
      .string()
      .regex(/^\d+(\.\d{1,2})?$/, "Enter a number like 1 or 2.5.")
      .transform(Number)
      .pipe(z.number().gt(0, "Must be more than 0.").max(MAX_QUANTITY, "Too large.")),
  );

const unitPrice = z.string().transform((value, ctx) => {
  const cents = toCents(value.trim());
  if (cents === null || cents < 0) {
    ctx.addIssue({ code: "custom", message: "Enter a price like 120 or 95.50." });
    return z.NEVER;
  }
  if (cents > MAX_UNIT_PRICE_CENTS) {
    ctx.addIssue({ code: "custom", message: "Too large." });
    return z.NEVER;
  }
  return cents;
});

export const invoiceLineSchema = z.object({
  /** Existing line id; empty for a new line. */
  id: z.union([z.uuid(), z.literal("")]).transform((v) => v || null),
  description: z.string().trim().min(1, "Enter a description.").max(1000, "Too long."),
  quantity,
  unitPrice,
});

/** Invoice editor payload (sent as a plain object, not FormData). */
export const invoiceFormSchema = z
  .object({
    number: z.string().trim().min(1, "Enter an invoice number.").max(30, "Use at most 30 characters."),
    issueDate: isoDateSchema,
    dueDate: isoDateSchema,
    subject: optionalText(200, "Subject is too long."),
    notes: optionalText(5000, "Notes are too long."),
    discountRate: percentInput,
    taxRate: percentInput,
    items: z.array(invoiceLineSchema).max(MAX_LINES, "Too many lines."),
  })
  .refine((v) => v.dueDate >= v.issueDate, {
    path: ["dueDate"],
    message: "The due date can't be before the issue date.",
  });

export type InvoiceFormInput = z.input<typeof invoiceFormSchema>;
export type InvoiceFormOutput = z.output<typeof invoiceFormSchema>;

export const INVOICE_FILTERS = ["all", "draft", "sent", "overdue", "paid", "void"] as const;
export type InvoiceFilter = (typeof INVOICE_FILTERS)[number];
export const invoiceFiltersSchema = z.object({
  status: z.enum(INVOICE_FILTERS).catch("all").default("all"),
});

export const STATUS_ACTIONS = ["send", "revert", "void"] as const;
export const statusActionSchema = z.enum(STATUS_ACTIONS);
export type StatusAction = z.infer<typeof statusActionSchema>;

export const TIME_GROUPINGS = [
  { value: "task", label: "By task", hint: "One line per project and task" },
  { value: "project", label: "By project", hint: "One line per project" },
  { value: "entry", label: "Detailed", hint: "One line per time entry, with date and notes" },
] as const;
export type TimeGrouping = (typeof TIME_GROUPINGS)[number]["value"];
const TIME_GROUPING_VALUES = TIME_GROUPINGS.map((g) => g.value) as [TimeGrouping, ...TimeGrouping[]];

/** Which unbilled time to add: all of it, or a date range. */
export const unbilledTimeSchema = z
  .object({
    period: z.enum(["all", "range"]).catch("all"),
    from: z.string().optional(),
    to: z.string().optional(),
    grouping: z.enum(TIME_GROUPING_VALUES).catch("task"),
  })
  .transform((v, ctx) => {
    if (v.period === "all") return { from: null, to: null, grouping: v.grouping };
    const from = isoDateSchema.safeParse(v.from ?? "");
    const to = isoDateSchema.safeParse(v.to ?? "");
    if (!from.success) ctx.addIssue({ code: "custom", path: ["from"], message: "Choose a start date." });
    if (!to.success) ctx.addIssue({ code: "custom", path: ["to"], message: "Choose an end date." });
    if (!from.success || !to.success) return z.NEVER;
    if (to.data < from.data) {
      ctx.addIssue({ code: "custom", path: ["to"], message: "The end date can't be before the start date." });
      return z.NEVER;
    }
    return { from: from.data, to: to.data, grouping: v.grouping };
  });

export const INVOICE_SOURCES = ["blank", "time"] as const;
export const invoiceSourceSchema = z.enum(INVOICE_SOURCES).catch("blank");

/** ?client=&source= on /app/invoices/new (e.g. "Create invoice" in the unbilled report). */
export const newInvoicePrefillSchema = z.object({
  client: z.uuid().optional().catch(undefined),
  source: invoiceSourceSchema,
});

/** ?notice= on the editor after creating a draft with time (see createInvoice). */
export const invoiceNoticeSchema = z.object({
  notice: z.enum(["no-time", "time-error"]).optional().catch(undefined),
});

/** Record payment form. The "not more than the amount due" rule is checked by record_payment. */
export const paymentFormSchema = z.object({
  amount: z
    .string()
    .trim()
    .transform((value, ctx) => {
      const cents = toCents(value);
      if (cents === null || cents <= 0) {
        ctx.addIssue({ code: "custom", message: "Enter an amount like 120 or 95.50." });
        return z.NEVER;
      }
      if (cents > MAX_AMOUNT_CENTS) {
        ctx.addIssue({ code: "custom", message: "Amount is too large." });
        return z.NEVER;
      }
      return cents;
    }),
  paidAt: isoDateSchema,
  method: z.enum(MANUAL_PAYMENT_METHODS, "Choose how it was paid."),
  notes: optionalText(500, "Keep notes under 500 characters."),
});
export type PaymentFormInput = z.input<typeof paymentFormSchema>;

export const paymentIdSchema = z.uuid();

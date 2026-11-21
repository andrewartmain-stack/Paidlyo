import { describe, expect, it } from "vitest";
import { balanceDueCents, formatQuantity, formatRate } from "@/features/invoices/document";
import {
  invoiceFiltersSchema,
  invoiceFormSchema,
  newInvoiceSchema,
  paymentFormSchema,
  shareTokenSchema,
} from "@/features/invoices/schemas";
import { statusAfterPayments } from "@/features/invoices/payments";
import { parseSharedInvoice } from "@/features/invoices/shared";
import { dueDateForTerm } from "@/features/invoices/terms";
import { invoiceTotals, lineAmountCents } from "@/features/invoices/totals";
import { displayStatus } from "@/features/invoices/types";
import { fieldErrorsByPath } from "@/lib/form-schemas";

const CLIENT = "6f1c2b4e-8d3a-4c7e-9b2f-1a2b3c4d5e6f";

describe("invoice totals (must match the database)", () => {
  it("computes line amounts with half-up rounding", () => {
    expect(lineAmountCents(1, 12000)).toBe(12000);
    expect(lineAmountCents(1.5, 9999)).toBe(14999); // 14998.5 → 14999
    expect(lineAmountCents(0.33, 1001)).toBe(330); // 330.33 → 330
    expect(lineAmountCents(1.15, 1000)).toBe(1150); // no float drift
  });

  it("applies discount before tax", () => {
    // subtotal 1000.00, 10% discount = 100.00, 20% tax on 900.00 = 180.00
    expect(invoiceTotals([{ quantity: 10, unitPriceCents: 10000 }], 10, 20)).toEqual({
      subtotalCents: 100000,
      discountCents: 10000,
      taxCents: 18000,
      totalCents: 108000,
    });
  });

  it("rounds discount and tax to the cent", () => {
    // subtotal 333 cents; 7.5% discount = 24.975 → 25; tax 19% of 308 = 58.52 → 59
    expect(invoiceTotals([{ quantity: 1, unitPriceCents: 333 }], 7.5, 19)).toEqual({
      subtotalCents: 333,
      discountCents: 25,
      taxCents: 59,
      totalCents: 367,
    });
  });

  it("handles empty invoices and large amounts without precision loss", () => {
    expect(invoiceTotals([], 0, 20).totalCents).toBe(0);
    // 999.99 × 999,999.99 = 999,989,990.0001 → 99,998,999,000 cents
    const large = invoiceTotals([{ quantity: 999.99, unitPriceCents: 99_999_999 }], 12.34, 19.99);
    expect(large.subtotalCents).toBe(99_998_999_000);
    expect(large.discountCents).toBe(12_339_876_477); // 12.34% of the subtotal, rounded
    expect(Number.isSafeInteger(large.totalCents)).toBe(true);
  });
});

describe("payment terms", () => {
  it("computes due dates", () => {
    expect(dueDateForTerm("2026-11-20", "receipt")).toBe("2026-11-20");
    expect(dueDateForTerm("2026-11-20", "net30")).toBe("2026-12-20");
    expect(dueDateForTerm("2026-12-15", "net45")).toBe("2027-01-29");
    expect(dueDateForTerm("2026-11-20", "custom")).toBeNull();
  });
});

describe("newInvoiceSchema", () => {
  it("derives the due date from the terms", () => {
    expect(newInvoiceSchema.parse({ clientId: CLIENT, issueDate: "2026-11-20", terms: "net15" })).toEqual({
      clientId: CLIENT,
      issueDate: "2026-11-20",
      dueDate: "2026-12-05",
    });
  });

  it("requires a valid custom due date on or after the issue date", () => {
    expect(
      newInvoiceSchema.parse({ clientId: CLIENT, issueDate: "2026-11-20", terms: "custom", dueDate: "2026-12-01" })
        .dueDate,
    ).toBe("2026-12-01");
    expect(
      newInvoiceSchema.safeParse({ clientId: CLIENT, issueDate: "2026-11-20", terms: "custom", dueDate: "2026-11-01" })
        .success,
    ).toBe(false);
    expect(newInvoiceSchema.safeParse({ clientId: CLIENT, issueDate: "2026-11-20", terms: "custom" }).success).toBe(
      false,
    );
  });
});

describe("invoiceFormSchema", () => {
  const base = {
    number: " INV-0042 ",
    issueDate: "2026-11-20",
    dueDate: "2026-12-20",
    subject: "",
    notes: "Bank: 123",
    discountRate: "",
    taxRate: "19,5",
    items: [{ id: "", description: " Design ", quantity: "2,5", unitPrice: "1,200.50" }],
  };

  it("parses the editor payload", () => {
    expect(invoiceFormSchema.parse(base)).toEqual({
      number: "INV-0042",
      issueDate: "2026-11-20",
      dueDate: "2026-12-20",
      subject: null,
      notes: "Bank: 123",
      discountRate: 0,
      taxRate: 19.5,
      items: [{ id: null, description: "Design", quantity: 2.5, unitPrice: 120050 }],
    });
  });

  it("reports line errors by path", () => {
    const result = invoiceFormSchema.safeParse({
      ...base,
      taxRate: "101",
      items: [{ id: "", description: "", quantity: "0", unitPrice: "abc" }],
    });
    expect(result.success).toBe(false);
    expect(Object.keys(fieldErrorsByPath(result.error!))).toEqual(
      expect.arrayContaining(["taxRate", "items.0.description", "items.0.quantity", "items.0.unitPrice"]),
    );
  });

  it("requires the due date on or after the issue date", () => {
    const result = invoiceFormSchema.safeParse({ ...base, dueDate: "2026-11-01" });
    expect(Object.keys(fieldErrorsByPath(result.error!))).toEqual(["dueDate"]);
  });

  it("rejects an invalid line id", () => {
    expect(invoiceFormSchema.safeParse({ ...base, items: [{ ...base.items[0], id: "x" }] }).success).toBe(false);
  });
});

describe("status", () => {
  it("shows overdue for open invoices past due", () => {
    expect(displayStatus("sent", "2026-11-19", "2026-11-20")).toBe("overdue");
    expect(displayStatus("sent", "2026-11-20", "2026-11-20")).toBe("sent");
    expect(displayStatus("draft", "2026-01-01", "2026-11-20")).toBe("draft");
    expect(displayStatus("paid", "2026-01-01", "2026-11-20")).toBe("paid");
  });

  it("defaults the list filter", () => {
    expect(invoiceFiltersSchema.parse({ status: "nope" }).status).toBe("all");
  });
});

describe("unbilled time", () => {
  it("parses period and grouping", async () => {
    const { unbilledTimeSchema } = await import("@/features/invoices/schemas");
    expect(unbilledTimeSchema.parse({ period: "all", grouping: "entry" })).toEqual({
      from: null,
      to: null,
      grouping: "entry",
    });
    expect(unbilledTimeSchema.parse({ period: "range", from: "2026-11-01", to: "2026-11-30" })).toEqual({
      from: "2026-11-01",
      to: "2026-11-30",
      grouping: "task",
    });
    expect(unbilledTimeSchema.safeParse({ period: "range", from: "2026-11-30", to: "2026-11-01" }).success).toBe(false);
    expect(unbilledTimeSchema.safeParse({ period: "range", from: "", to: "2026-11-01" }).success).toBe(false);
    expect(unbilledTimeSchema.parse({ period: "weird", grouping: "weird" })).toEqual({
      from: null,
      to: null,
      grouping: "task",
    });
  });

  it("sums unbilled time per client and labels it", async () => {
    const { unbilledLabel, unbilledTotals } = await import("@/features/invoices/unbilled");
    const totals = unbilledTotals([
      { clientId: "a", minutes: 90, hourlyRateCents: 10000 }, // 1.5 h × $100
      { clientId: "a", minutes: 20, hourlyRateCents: 12000 }, // 0.33 h × $120 = $39.60
      { clientId: "b", minutes: 60, hourlyRateCents: null },
    ]);
    expect(totals.get("a")).toEqual({ minutes: 110, amountCents: 18960 });
    expect(totals.get("b")).toEqual({ minutes: 60, amountCents: 0 });
    expect(unbilledLabel(totals.get("a"), "USD")).toBe("1:50 unbilled (≈ $189.60)");
    expect(unbilledLabel(undefined, "USD")).toBeNull();
  });
});

describe("invoice document helpers", () => {
  it("formats quantities without trailing zeros", () => {
    expect(formatQuantity(1.5)).toBe("1.5");
    expect(formatQuantity(2)).toBe("2");
    expect(formatQuantity(0.25)).toBe("0.25");
    expect(formatQuantity(1234.5)).toBe("1,234.5");
  });

  it("formats rates without trailing zeros", () => {
    expect(formatRate(10)).toBe("10");
    expect(formatRate(7.5)).toBe("7.5");
    expect(formatRate(8.875)).toBe("8.875");
  });

  it("never shows a negative balance", () => {
    expect(balanceDueCents(10_000, 2_500)).toBe(7_500);
    expect(balanceDueCents(10_000, 0)).toBe(10_000);
    expect(balanceDueCents(10_000, 12_000)).toBe(0);
  });
});

describe("client link", () => {
  it("accepts only uuid tokens", () => {
    expect(shareTokenSchema.safeParse("3f2b8c1e-7a4d-4e9b-9c2a-1d5e6f7a8b9c").success).toBe(true);
    expect(shareTokenSchema.safeParse("not-a-token").success).toBe(false);
    expect(shareTokenSchema.safeParse("").success).toBe(false);
  });

  const row = {
    number: "INV-0001",
    status: "sent",
    issue_date: "2026-11-01",
    due_date: "2026-11-15",
    currency: "USD",
    subject: null,
    notes: "Thanks!",
    discount_rate: 0,
    tax_rate: 10,
    subtotal_cents: 4000,
    discount_cents: 0,
    tax_cents: 400,
    total_cents: 4400,
    amount_paid_cents: 0,
    client: { name: "Acme", email: null, address: "1 Main St" },
    organization: { name: "Studio", address: "", logo_path: "org/logo.png", timezone: "UTC" },
    items: [
      { position: 2, description: "Design", quantity: 1.5, unit_price_cents: 2000, amount_cents: 3000 },
      { position: 1, description: "Setup", quantity: 1, unit_price_cents: 1000, amount_cents: 1000 },
    ],
  };
  const logoUrl = (path: string | null) => (path ? `https://cdn/${path}` : null);

  it("returns null for unknown tokens and drafts (RPC returns null)", () => {
    expect(parseSharedInvoice(null, logoUrl)).toBeNull();
  });

  it("maps the RPC result to the invoice document", () => {
    const shared = parseSharedInvoice(row, logoUrl);
    expect(shared?.invoice.totalCents).toBe(4400);
    expect(shared?.invoice.issueDate).toBe("2026-11-01");
    expect(shared?.invoice.items.map((i) => i.key)).toEqual(["2", "1"]);
    expect(shared?.invoice.items[0]).toMatchObject({ quantity: 1.5, unitPriceCents: 2000, amountCents: 3000 });
    expect(shared?.sender).toEqual({ name: "Studio", address: "", logoUrl: "https://cdn/org/logo.png" });
    expect(shared?.timezone).toBe("UTC");
  });

  it("rejects unexpected shapes, including drafts", () => {
    expect(() => parseSharedInvoice({ ...row, status: "draft" }, logoUrl)).toThrow();
    expect(() => parseSharedInvoice({ number: "x" }, logoUrl)).toThrow();
  });
});

describe("payments", () => {
  it("derives the status from the amount paid (mirrors apply_invoice_payments)", () => {
    expect(statusAfterPayments(10_000, 0)).toBe("sent");
    expect(statusAfterPayments(10_000, 2_500)).toBe("partially_paid");
    expect(statusAfterPayments(10_000, 10_000)).toBe("paid");
    expect(statusAfterPayments(0, 0)).toBe("sent");
  });

  const valid = { amount: "1,250.50", paidAt: "2026-11-20", method: "bank_transfer", notes: "  REF-42 " };

  it("parses a payment form", () => {
    const parsed = paymentFormSchema.parse(valid);
    expect(parsed).toEqual({ amount: 125_050, paidAt: "2026-11-20", method: "bank_transfer", notes: "REF-42" });
    expect(paymentFormSchema.parse({ ...valid, notes: "" }).notes).toBeNull();
  });

  it("rejects zero, negative and malformed amounts", () => {
    for (const amount of ["0", "-5", "", "abc", "1.234"]) {
      expect(paymentFormSchema.safeParse({ ...valid, amount }).success).toBe(false);
    }
  });

  it("rejects unknown methods, Stripe and bad dates", () => {
    expect(paymentFormSchema.safeParse({ ...valid, method: "stripe" }).success).toBe(false);
    expect(paymentFormSchema.safeParse({ ...valid, method: "bitcoin" }).success).toBe(false);
    expect(paymentFormSchema.safeParse({ ...valid, paidAt: "20/11/2026" }).success).toBe(false);
  });

  it("accepts the paid filter", () => {
    expect(invoiceFiltersSchema.parse({ status: "paid" }).status).toBe("paid");
  });
});

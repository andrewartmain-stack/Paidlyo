import { describe, expect, it } from "vitest";
import {
  entryAmountCents,
  formatMoneyTotals,
  groupEntries,
  percentOf,
  summarize,
  type ReportEntry,
} from "@/features/reports/aggregate";
import { centsToDecimal, csvCell, outstandingCsv, timeEntriesCsv, toCsv, unbilledCsv } from "@/features/reports/csv";
import { agingBucket, agingSummary, daysOverdue, toOutstanding, type OpenInvoice } from "@/features/reports/outstanding";
import { groupUnbilled, unbilledSummary, type UnbilledEntry } from "@/features/reports/unbilled";
import { newInvoicePrefillSchema } from "@/features/invoices/schemas";
import { reportHref, resolveReportRange } from "@/features/reports/periods";
import { reportFiltersSchema, reportKindSchema } from "@/features/reports/schemas";

const acme = { id: "c1", name: "Acme", currency: "USD" };
const euro = { id: "c2", name: "Euro GmbH", currency: "EUR" };

function entry(overrides: Partial<ReportEntry> = {}): ReportEntry {
  return {
    id: "e1",
    spentDate: "2026-11-02",
    minutes: 90,
    notes: null,
    isBillable: true,
    hourlyRateCents: 10_000,
    invoiced: false,
    timerRunning: false,
    personName: "Sam",
    client: acme,
    project: { id: "p1", name: "Website" },
    task: { id: "t1", name: "Design" },
    ...overrides,
  };
}

describe("report filters", () => {
  it("falls back to defaults for invalid values", () => {
    expect(reportFiltersSchema.parse({ period: "decade", group: "x", from: ["a", "b"] })).toEqual({
      period: "this_month",
      group: "client",
      from: undefined,
      to: undefined,
    });
  });
});

describe("resolveReportRange", () => {
  const today = "2026-11-20"; // Friday

  it("resolves weeks from Monday", () => {
    expect(resolveReportRange({ period: "this_week" }, today)).toEqual({ period: "this_week", from: "2026-11-16", to: "2026-11-22" });
    expect(resolveReportRange({ period: "last_week" }, today)).toEqual({ period: "last_week", from: "2026-11-09", to: "2026-11-15" });
  });

  it("resolves months and years, across year boundaries", () => {
    expect(resolveReportRange({ period: "this_month" }, today)).toMatchObject({ from: "2026-11-01", to: "2026-11-30" });
    expect(resolveReportRange({ period: "last_month" }, "2026-01-15")).toMatchObject({ from: "2025-12-01", to: "2025-12-31" });
    expect(resolveReportRange({ period: "this_month" }, "2028-02-10")).toMatchObject({ to: "2028-02-29" });
    expect(resolveReportRange({ period: "this_year" }, today)).toMatchObject({ from: "2026-01-01", to: "2026-12-31" });
  });

  it("accepts a valid custom range and falls back otherwise", () => {
    expect(resolveReportRange({ period: "custom", from: "2026-10-05", to: "2026-10-09" }, today)).toEqual({
      period: "custom",
      from: "2026-10-05",
      to: "2026-10-09",
    });
    expect(resolveReportRange({ period: "custom", from: "2026-10-09", to: "2026-10-05" }, today).period).toBe("this_month");
    expect(resolveReportRange({ period: "custom", from: "2026-02-30", to: "2026-03-01" }, today).period).toBe("this_month");
    expect(resolveReportRange({ period: "custom" }, today).period).toBe("this_month");
  });

  it("builds hrefs without default values", () => {
    expect(reportHref("/app/reports", resolveReportRange({ period: "this_month" }, today), "client")).toBe("/app/reports");
    expect(
      reportHref("/app/reports", { period: "custom", from: "2026-10-05", to: "2026-10-09" }, "task"),
    ).toBe("/app/reports?period=custom&from=2026-10-05&to=2026-10-09&group=task");
  });
});

describe("report totals", () => {
  it("prices billable entries only, hours rounded to 0.01", () => {
    expect(entryAmountCents(entry())).toBe(15_000);
    expect(entryAmountCents(entry({ minutes: 20 }))).toBe(3_300); // 0.33 h
    expect(entryAmountCents(entry({ isBillable: false }))).toBe(0);
    expect(entryAmountCents(entry({ hourlyRateCents: null }))).toBe(0);
  });

  it("summarizes hours and keeps currencies apart", () => {
    const summary = summarize([
      entry(),
      entry({ id: "e2", invoiced: true }),
      entry({ id: "e3", isBillable: false, minutes: 30 }),
      entry({ id: "e4", client: euro, minutes: 60 }),
    ]);
    expect(summary).toEqual({
      minutes: 270,
      billableMinutes: 240,
      billableAmount: { USD: 30_000, EUR: 10_000 },
      unbilledAmount: { USD: 15_000, EUR: 10_000 },
    });
  });

  it("groups by client, project and task, most hours first", () => {
    const entries = [
      entry(),
      entry({ id: "e2", client: euro, project: { id: "p2", name: "App" }, minutes: 240 }),
      entry({ id: "e3", task: { id: "t2", name: "Build" }, isBillable: false, minutes: 30 }),
    ];
    expect(groupEntries(entries, "client").map((r) => [r.label, r.minutes, r.billableMinutes])).toEqual([
      ["Euro GmbH", 240, 240],
      ["Acme", 120, 90],
    ]);
    expect(groupEntries(entries, "project")[1]).toMatchObject({ label: "Website", detail: "Acme", amount: { USD: 15_000 } });
    expect(groupEntries(entries, "task").map((r) => r.label)).toEqual(["Design", "Build"]);
  });

  it("formats multi-currency totals and percentages", () => {
    expect(formatMoneyTotals({ USD: 120_000, EUR: 80_000 }, "USD")).toBe("€800.00 · $1,200.00");
    expect(formatMoneyTotals({}, "USD")).toBe("$0.00");
    expect(percentOf(1, 3)).toBe(33);
    expect(percentOf(5, 0)).toBe(0);
  });
});

describe("CSV export", () => {
  it("escapes cells and blocks spreadsheet formulas", () => {
    expect(csvCell("plain")).toBe("plain");
    expect(csvCell('say "hi", ok')).toBe('"say ""hi"", ok"');
    expect(csvCell("line\nbreak")).toBe('"line\nbreak"');
    expect(csvCell("=HYPERLINK(1)")).toBe("'=HYPERLINK(1)");
    expect(csvCell("-1+2")).toBe("'-1+2");
    expect(csvCell("@cmd,x")).toBe(`"'@cmd,x"`);
    expect(csvCell(-5)).toBe("-5");
    expect(csvCell(null)).toBe("");
    expect(csvCell(true)).toBe("Yes");
  });

  it("writes a BOM and CRLF rows", () => {
    expect(toCsv([["a", 1], ["b", null]])).toBe("﻿a,1\r\nb,\r\n");
  });

  it("formats cents exactly", () => {
    expect(centsToDecimal(12_050)).toBe("120.50");
    expect(centsToDecimal(5)).toBe("0.05");
    expect(centsToDecimal(0)).toBe("0.00");
  });

  it("writes one row per entry", () => {
    const csv = timeEntriesCsv([entry({ notes: "Kick-off, call" }), entry({ id: "e2", isBillable: false, hourlyRateCents: null })]);
    const lines = csv.slice(1).trimEnd().split("\r\n");
    expect(lines[0]).toBe("Date,Client,Project,Task,Person,Notes,Hours,Billable,Rate,Amount,Currency,Invoiced");
    expect(lines[1]).toBe('2026-11-02,Acme,Website,Design,Sam,"Kick-off, call",1.5,Yes,100.00,150.00,USD,No');
    expect(lines[2]).toBe("2026-11-02,Acme,Website,Design,Sam,,1.5,No,,,USD,No");
  });
});

describe("unbilled report", () => {
  const unbilled = (overrides: Partial<UnbilledEntry> = {}): UnbilledEntry => ({
    spentDate: "2026-11-02",
    minutes: 60,
    hourlyRateCents: 10_000,
    client: acme,
    project: { id: "p1", name: "Website" },
    ...overrides,
  });

  it("groups by client and project, oldest unbilled time first", () => {
    const clients = groupUnbilled([
      unbilled(),
      unbilled({ spentDate: "2026-10-01", project: { id: "p2", name: "App" }, minutes: 30 }),
      unbilled({ spentDate: "2026-09-15", client: euro, project: { id: "p3", name: "Shop" } }),
    ]);
    expect(clients.map((c) => [c.name, c.minutes, c.amountCents, c.oldestDate])).toEqual([
      ["Euro GmbH", 60, 10_000, "2026-09-15"],
      ["Acme", 90, 15_000, "2026-10-01"],
    ]);
    expect(clients[1].projects.map((p) => p.name)).toEqual(["App", "Website"]);
    expect(unbilledSummary(clients)).toEqual({ minutes: 150, amount: { EUR: 10_000, USD: 15_000 } });
  });

  it("writes one CSV row per project", () => {
    const lines = unbilledCsv(groupUnbilled([unbilled({ minutes: 90 })])).slice(1).trimEnd().split("\r\n");
    expect(lines).toEqual([
      "Client,Project,Hours,Estimated amount,Currency,Oldest entry",
      "Acme,Website,1.5,150.00,USD,2026-11-02",
    ]);
  });
});

describe("outstanding report", () => {
  const today = "2026-11-20";
  const open = (overrides: Partial<OpenInvoice> = {}): OpenInvoice => ({
    id: "i1",
    number: "INV-0001",
    client: { id: "c1", name: "Acme" },
    issueDate: "2026-10-01",
    dueDate: "2026-10-31",
    currency: "USD",
    totalCents: 100_000,
    amountPaidCents: 0,
    ...overrides,
  });

  it("counts days from the due date into aging buckets", () => {
    expect(daysOverdue("2026-11-20", today)).toBe(0);
    expect(daysOverdue("2026-11-25", today)).toBe(-5);
    expect(daysOverdue("2026-10-31", today)).toBe(20);
    expect([0, -3, 1, 30, 31, 60, 61, 90, 91].map(agingBucket)).toEqual([
      "current",
      "current",
      "1_30",
      "1_30",
      "31_60",
      "31_60",
      "61_90",
      "61_90",
      "over_90",
    ]);
  });

  it("uses the balance due, most overdue first, and sums per currency", () => {
    const invoices = toOutstanding(
      [
        open({ id: "a", number: "INV-0003", dueDate: "2026-12-01" }),
        open({ id: "b", number: "INV-0002", dueDate: "2026-07-01", amountPaidCents: 40_000 }),
        open({ id: "c", number: "INV-0004", currency: "EUR", dueDate: "2026-11-10" }),
        open({ id: "d", number: "INV-0005", amountPaidCents: 100_000 }),
      ],
      today,
    );
    expect(invoices.map((i) => [i.id, i.balanceCents, i.bucket])).toEqual([
      ["b", 60_000, "over_90"],
      ["c", 100_000, "1_30"],
      ["a", 100_000, "current"],
    ]);
    const summary = agingSummary(invoices);
    expect(summary.total).toEqual({ USD: 160_000, EUR: 100_000 });
    expect(summary.buckets.over_90).toEqual({ USD: 60_000 });
    expect(summary.buckets["31_60"]).toEqual({});
  });

  it("writes one CSV row per invoice", () => {
    const lines = outstandingCsv(toOutstanding([open({ amountPaidCents: 25_050 })], today)).slice(1).trimEnd().split("\r\n");
    expect(lines[1]).toBe("INV-0001,Acme,2026-10-01,2026-10-31,20,1–30 days overdue,1000.00,250.50,749.50,USD");
  });
});

describe("new invoice prefill", () => {
  it("accepts a client id and source, ignoring bad values", () => {
    const id = "6f1c2c1e-8a5b-4c2d-9e1f-0a1b2c3d4e5f";
    expect(newInvoicePrefillSchema.parse({ client: id, source: "time" })).toEqual({ client: id, source: "time" });
    expect(newInvoicePrefillSchema.parse({ client: "x", source: "other" })).toEqual({ client: undefined, source: "blank" });
  });

  it("defaults the export to the time report", () => {
    expect(reportKindSchema.parse(undefined)).toBe("time");
    expect(reportKindSchema.parse("outstanding")).toBe("outstanding");
  });
});

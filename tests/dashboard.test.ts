import { describe, expect, it } from "vitest";
import {
  attentionItems,
  checklistDone,
  checklistSteps,
  firstName,
  greeting,
  hourIn,
  MAX_ATTENTION_ITEMS,
  monthStart,
  weekBars,
} from "@/features/dashboard/compute";
import { budgetStatus } from "@/features/projects/budget";
import type { OutstandingInvoice } from "@/features/reports/outstanding";
import type { UnbilledClientRow } from "@/features/reports/unbilled";
import { weekDays } from "@/features/time/dates";

describe("greeting", () => {
  it("follows the time of day in the organization's timezone", () => {
    const now = new Date("2026-11-21T08:30:00Z");
    expect(hourIn("UTC", now)).toBe(8);
    expect(hourIn("Europe/Bucharest", now)).toBe(10);
    expect(hourIn("America/New_York", now)).toBe(3);
    expect(greeting(3)).toBe("Good evening");
    expect(greeting(9)).toBe("Good morning");
    expect(greeting(14)).toBe("Good afternoon");
    expect(greeting(20)).toBe("Good evening");
  });

  it("uses the first name only", () => {
    expect(firstName("  Andrei Artemov ")).toBe("Andrei");
    expect(firstName("")).toBe("");
  });
});

describe("checklistSteps", () => {
  it("ticks off each step from the counts and finishes when all are done", () => {
    const fresh = checklistSteps({ clients: 0, projects: 0, timeEntries: 0, sentInvoices: 0 });
    expect(fresh.filter((step) => step.done).map((step) => step.key)).toEqual(["workspace"]);
    expect(checklistDone(fresh)).toBe(false);

    const all = checklistSteps({ clients: 1, projects: 2, timeEntries: 5, sentInvoices: 1 });
    expect(checklistDone(all)).toBe(true);
  });
});

describe("weekBars", () => {
  const days = weekDays("2026-11-18"); // Mon 16 – Sun 22 Nov

  it("scales bars to an 8-hour day unless a day is longer", () => {
    const bars = weekBars(days, new Map([["2026-11-16", 240]]), "2026-11-18");
    expect(bars).toHaveLength(7);
    expect(bars[0]).toMatchObject({ minutes: 240, heightPct: 50, isToday: false });
    expect(bars[2]).toMatchObject({ isToday: true, isFuture: false });
    expect(bars[3].isFuture).toBe(true);

    const long = weekBars(days, new Map([["2026-11-16", 600], ["2026-11-17", 300]]), "2026-11-18");
    expect(long[0].heightPct).toBe(100);
    expect(long[1].heightPct).toBe(50);
  });
});

function outstanding(id: string, daysOverdue: number): OutstandingInvoice {
  return {
    id,
    number: `INV-${id}`,
    client: { id: "c1", name: "Acme" },
    issueDate: "2026-10-01",
    dueDate: "2026-10-31",
    currency: "USD",
    totalCents: 10_000,
    amountPaidCents: 0,
    balanceCents: 10_000,
    daysOverdue,
    bucket: daysOverdue > 0 ? "1_30" : "current",
  };
}

function unbilled(id: string, amountCents: number): UnbilledClientRow {
  return { id, name: `Client ${id}`, currency: "EUR", minutes: 120, amountCents, oldestDate: "2026-11-01", projects: [] };
}

describe("attentionItems", () => {
  it("puts a running timer first, then overdue invoices, then unbilled clients", () => {
    const items = attentionItems({
      runningTimer: { entryId: "e1", label: "Website · Design", startedAt: "2026-11-21T08:00:00Z" },
      outstanding: [outstanding("1", 12), outstanding("2", 0)],
      unbilledClients: [unbilled("a", 5_000), unbilled("b", 0)],
    });
    expect(items.map((item) => item.kind)).toEqual(["timer", "overdue", "unbilled"]);
  });

  it("lists projects near or over budget after overdue invoices", () => {
    const progress = (pct: number) => ({ kind: "hours" as const, used: pct, total: 100, pct, status: budgetStatus(pct) });
    const items = attentionItems({
      runningTimer: null,
      outstanding: [outstanding("1", 3)],
      unbilledClients: [unbilled("a", 5_000)],
      budgetAlerts: [
        { projectId: "p1", projectName: "Site", clientName: "Acme", progress: progress(120) },
        { projectId: "p2", projectName: "App", clientName: "Acme", progress: progress(50) },
      ],
    });
    expect(items.map((item) => item.kind)).toEqual(["overdue", "budget", "unbilled"]);

    const withTimesheets = attentionItems({
      runningTimer: null,
      outstanding: [outstanding("1", 3)],
      unbilledClients: [],
      pendingTimesheets: 2,
      budgetAlerts: [{ projectId: "p1", projectName: "Site", clientName: "Acme", progress: progress(120) }],
    });
    expect(withTimesheets.map((item) => item.kind)).toEqual(["overdue", "timesheets", "budget"]);
    expect(items[1]).toMatchObject({ projectId: "p1", over: true, pct: 120 });
  });

  it("is capped so the card stays short", () => {
    const items = attentionItems({
      runningTimer: null,
      outstanding: Array.from({ length: 8 }, (_, i) => outstanding(String(i), 10 + i)),
      unbilledClients: [],
    });
    expect(items).toHaveLength(MAX_ATTENTION_ITEMS);
  });
});

describe("monthStart", () => {
  it("returns the first day of the month", () => {
    expect(monthStart("2026-11-21")).toBe("2026-11-01");
  });
});

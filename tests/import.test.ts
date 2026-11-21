import { describe, expect, it } from "vitest";
import { parseCsv } from "@/features/import/csv-parse";
import { currencyCode, hoursToMinutes, parseHarvestCsv, type HarvestRow } from "@/features/import/harvest";
import { buildImportPlan, importKeys, nameKey, type ExistingData } from "@/features/import/plan";

const HEADER =
  "Date,Client,Project,Project Code,Task,Notes,Hours,Hours Rounded,Billable?,Invoiced?,Approved?,First Name,Last Name,Roles,Employee?,Billable Rate,Billable Amount,Cost Rate,Cost Amount,Currency,External Reference URL";

function csv(...lines: string[]) {
  return [HEADER, ...lines].join("\r\n");
}

describe("parseCsv", () => {
  it("handles quotes, escaped quotes, line breaks, BOM and blank lines", () => {
    expect(parseCsv('﻿a,b\r\n"x, y","say ""hi"""\n"multi\nline",\n\n')).toEqual([
      ["a", "b"],
      ["x, y", 'say "hi"'],
      ["multi\nline", ""],
    ]);
  });

  it("returns null for an unclosed quote", () => {
    expect(parseCsv('a,"b\n')).toBeNull();
  });
});

describe("Harvest CSV", () => {
  it("parses hours and currency formats", () => {
    expect(hoursToMinutes("1.5")).toBe(90);
    expect(hoursToMinutes("0,25")).toBe(15);
    expect(hoursToMinutes("2")).toBe(120);
    expect(hoursToMinutes("abc")).toBeNull();
    expect(currencyCode("United States Dollar - USD")).toBe("USD");
    expect(currencyCode("Euro (EUR)")).toBe("EUR");
    expect(currencyCode("EUR")).toBe("EUR");
    expect(currencyCode("Dollars")).toBeNull();
  });

  it("reads rows by header name and reports bad rows", () => {
    const result = parseHarvestCsv(
      csv(
        '2026-11-02,Acme,Website,WEB,Design,"Kick-off, call",1.5,1.5,Yes,No,No,Sam,Lee,,Yes,150.00,225.00,0,0,United States Dollar - USD,',
        "02/11/2026,Acme,Website,,Design,,1,1,Yes,No,No,Sam,Lee,,Yes,150,150,0,0,USD,",
        "2026-11-03,,Website,,Design,,1,1,Yes,No,No,Sam,Lee,,Yes,150,150,0,0,USD,",
        "2026-11-03,Acme,Website,,Design,,25,25,Yes,No,No,Sam,Lee,,Yes,150,150,0,0,USD,",
      ),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.rows).toEqual([
      {
        row: 2,
        date: "2026-11-02",
        client: "Acme",
        project: "Website",
        projectCode: "WEB",
        task: "Design",
        notes: "Kick-off, call",
        minutes: 90,
        billable: true,
        invoiced: false,
        rateCents: 15_000,
        currency: "USD",
        person: "Sam Lee",
      },
    ]);
    expect(result.errors.map((e) => e.row)).toEqual([3, 4, 5]);
    expect(result.errors[0].message).toContain("YYYY-MM-DD");
  });

  it("rejects files without the Harvest columns", () => {
    const result = parseHarvestCsv("Name,Amount\nx,1");
    expect(result).toMatchObject({ ok: false });
  });
});

function row(overrides: Partial<HarvestRow> = {}): HarvestRow {
  return {
    row: 2,
    date: "2026-11-02",
    client: "Acme",
    project: "Website",
    projectCode: null,
    task: "Design",
    notes: null,
    minutes: 60,
    billable: true,
    invoiced: false,
    rateCents: 10_000,
    currency: "USD",
    person: "Sam Lee",
    ...overrides,
  };
}

const empty: ExistingData = { clients: [], projects: [], tasks: [], projectTasks: [], importKeys: new Set() };
const options = { includeInvoiced: false, orgCurrency: "EUR" };

function ids() {
  let n = 0;
  return () => `id-${++n}`;
}

describe("import keys", () => {
  it("are stable and keep identical rows apart", () => {
    const rows = [row(), row(), row({ minutes: 30 })];
    const keys = importKeys(rows);
    expect(new Set(keys).size).toBe(3);
    expect(importKeys(rows)).toEqual(keys);
    expect(importKeys([row({ client: " acme ", project: "WEBSITE" })])[0]).toBe(keys[0]);
    expect(keys[0]).toMatch(/^harvest:[0-9a-f]{40}$/);
  });

  it("matches names ignoring case and spacing", () => {
    expect(nameKey("  Acme   Inc ")).toBe("acme inc");
  });
});

describe("buildImportPlan", () => {
  it("creates missing records and picks the most common rate for new projects", () => {
    const { payload, preview } = buildImportPlan(
      [
        row(),
        row({ row: 3, rateCents: 10_000 }),
        row({ row: 4, rateCents: 12_000, task: "Build" }),
        row({ row: 5, client: "Beta", project: "Internal", billable: false, rateCents: null, currency: null }),
      ],
      [],
      empty,
      options,
      ids(),
    );
    expect(payload.clients).toEqual([
      { id: "id-1", name: "Acme", currency: "USD" },
      { id: "id-5", name: "Beta", currency: "EUR" },
    ]);
    expect(payload.projects).toEqual([
      { id: "id-2", client_id: "id-1", name: "Website", code: null, billing_method: "project_rate", hourly_rate_cents: 10_000 },
      { id: "id-6", client_id: "id-5", name: "Internal", code: null, billing_method: "none", hourly_rate_cents: null },
    ]);
    expect(payload.project_tasks).toEqual([
      { project_id: "id-2", task_id: "id-3", is_billable: true },
      { project_id: "id-2", task_id: "id-4", is_billable: true },
      { project_id: "id-6", task_id: "id-3", is_billable: false },
    ]);
    expect(payload.entries).toHaveLength(3);
    expect(payload.non_billable_entries).toHaveLength(1);
    expect(preview).toMatchObject({
      newEntries: 4,
      newMinutes: 240,
      rateMismatches: 1,
      newClients: ["Acme", "Beta"],
      newTasks: ["Design", "Build"],
      reusedClients: 0,
      people: [{ name: "Sam Lee", rows: 4 }],
    });
  });

  it("reuses existing records by name and skips rows imported before", () => {
    const [key] = importKeys([row()]);
    const existing: ExistingData = {
      clients: [{ id: "c1", name: "ACME" }],
      projects: [{ id: "p1", clientId: "c1", name: "website", archived: false }],
      tasks: [{ id: "t1", name: "design" }],
      projectTasks: [{ projectId: "p1", taskId: "t1" }],
      importKeys: new Set([key]),
    };
    const { payload, preview } = buildImportPlan([row(), row({ row: 3, minutes: 30 })], [], existing, options, ids());
    expect(payload.clients).toEqual([]);
    expect(payload.projects).toEqual([]);
    expect(payload.tasks).toEqual([]);
    expect(payload.project_tasks).toEqual([]);
    expect(payload.entries).toEqual([
      expect.objectContaining({ project_id: "p1", task_id: "t1", minutes: 30, spent_date: "2026-11-02" }),
    ]);
    expect(preview).toMatchObject({ duplicates: 1, newEntries: 1, reusedClients: 1, reusedProjects: 1, reusedTasks: 1 });
  });

  it("skips invoiced rows unless asked, then imports them as non-billable", () => {
    const rows = [row({ invoiced: true }), row({ row: 3, minutes: 30 })];
    expect(buildImportPlan(rows, [], empty, options, ids()).preview).toMatchObject({ invoicedSkipped: 1, newEntries: 1 });
    const included = buildImportPlan(rows, [], empty, { ...options, includeInvoiced: true }, ids());
    expect(included.payload.entries).toHaveLength(1);
    expect(included.payload.non_billable_entries).toHaveLength(1);
  });

  it("reports rows on archived projects instead of importing them", () => {
    const existing: ExistingData = {
      ...empty,
      clients: [{ id: "c1", name: "Acme" }],
      projects: [{ id: "p1", clientId: "c1", name: "Website", archived: true }],
    };
    const { payload, preview } = buildImportPlan([row()], [{ row: 9, message: "bad" }], existing, options, ids());
    expect(payload.entries).toEqual([]);
    expect(preview.errors.map((e) => e.row)).toEqual([2, 9]);
    expect(preview.errors[0].message).toContain("archived");
  });
});

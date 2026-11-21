import { describe, expect, it } from "vitest";
import { formatWeekRange, weekDays } from "@/features/time/dates";
import { timesheetParamsSchema, weekCellSchema } from "@/features/time/schemas";
import type { TimeEntry } from "@/features/time/types";
import { buildWeekRows, decideCellChange, type CellEntry } from "@/features/time/week";

const days = weekDays("2026-11-20");
const NOW = Date.parse("2026-11-20T12:00:00Z");

function entry(overrides: Partial<TimeEntry> & { projectName?: string; taskName?: string }): TimeEntry {
  const { projectName = "Website", taskName = "Design", ...rest } = overrides;
  return {
    id: crypto.randomUUID(),
    spentDate: "2026-11-16",
    minutes: 60,
    notes: null,
    isBillable: true,
    timerStartedAt: null,
    invoiced: false,
    project: { id: `p-${projectName}`, name: projectName, code: null, clientName: "Acme" },
    task: { id: `t-${taskName}`, name: taskName },
    ...rest,
  };
}

describe("buildWeekRows", () => {
  it("groups entries by project + task with per-day cells and totals", () => {
    const rows = buildWeekRows(
      [
        entry({ spentDate: "2026-11-16", minutes: 120 }),
        entry({ spentDate: "2026-11-17", minutes: 90 }),
        entry({ spentDate: "2026-11-17", minutes: 30, taskName: "Development" }),
      ],
      days,
      NOW,
    );
    expect(rows.map((r) => r.task.name)).toEqual(["Design", "Development"]);
    expect(rows[0].cells["2026-11-16"]).toMatchObject({ minutes: 120, editable: true, entryCount: 1 });
    expect(rows[0].cells["2026-11-18"]).toMatchObject({ minutes: 0, editable: true, entryCount: 0 });
    expect(rows[0].total).toBe(210);
  });

  it("makes cells with several entries or a running timer read-only", () => {
    const rows = buildWeekRows(
      [
        entry({ spentDate: "2026-11-16", minutes: 30 }),
        entry({ spentDate: "2026-11-16", minutes: 45 }),
        entry({ spentDate: "2026-11-20", minutes: 10, timerStartedAt: "2026-11-20T11:00:00Z" }),
      ],
      days,
      NOW,
    );
    expect(rows[0].cells["2026-11-16"]).toMatchObject({ minutes: 75, editable: false, entryCount: 2 });
    expect(rows[0].cells["2026-11-20"]).toMatchObject({ minutes: 70, editable: false, running: true });
  });

  it("locks cells that contain invoiced time", () => {
    const rows = buildWeekRows([entry({ spentDate: "2026-11-18", invoiced: true })], days, NOW);
    expect(rows[0].cells["2026-11-18"]).toMatchObject({ editable: false, invoiced: true });
  });

  it("sorts rows by client, project, task", () => {
    const rows = buildWeekRows(
      [entry({ projectName: "Zebra" }), entry({ projectName: "Apple", taskName: "QA" }), entry({ projectName: "Apple" })],
      days,
      NOW,
    );
    expect(rows.map((r) => `${r.project.name}/${r.task.name}`)).toEqual(["Apple/Design", "Apple/QA", "Zebra/Design"]);
  });
});

describe("decideCellChange", () => {
  const one = (o: Partial<CellEntry> = {}): CellEntry => ({
    id: "e1",
    minutes: 60,
    notes: null,
    running: false,
    invoiced: false,
    ...o,
  });

  it("creates when the cell is empty", () => {
    expect(decideCellChange([], 90)).toEqual({ kind: "create", minutes: 90 });
    expect(decideCellChange([], null)).toEqual({ kind: "none" });
    expect(decideCellChange([], 0)).toEqual({ kind: "none" });
  });

  it("updates or leaves a single entry", () => {
    expect(decideCellChange([one()], 90)).toEqual({ kind: "update", id: "e1", minutes: 90 });
    expect(decideCellChange([one()], 60)).toEqual({ kind: "none" });
  });

  it("clearing deletes, unless the entry has notes (then 0:00)", () => {
    expect(decideCellChange([one()], null)).toEqual({ kind: "delete", id: "e1" });
    expect(decideCellChange([one({ notes: "Call" })], 0)).toEqual({ kind: "update", id: "e1", minutes: 0 });
    expect(decideCellChange([one({ notes: "Call", minutes: 0 })], null)).toEqual({ kind: "none" });
  });

  it("refuses to change invoiced time", () => {
    expect(decideCellChange([one({ invoiced: true })], 30)).toMatchObject({ kind: "refuse" });
    expect(decideCellChange([one({ invoiced: true })], null)).toMatchObject({ kind: "refuse" });
  });

  it("refuses with several entries or a running timer", () => {
    expect(decideCellChange([one(), one({ id: "e2" })], 30).kind).toBe("refuse");
    expect(decideCellChange([one({ running: true })], 30).kind).toBe("refuse");
  });
});

describe("week schemas and formatting", () => {
  it("parses the view param", () => {
    expect(timesheetParamsSchema.parse({}).view).toBe("day");
    expect(timesheetParamsSchema.parse({ view: "week" }).view).toBe("week");
    expect(timesheetParamsSchema.parse({ view: "month" }).view).toBe("day");
  });

  it("validates a cell edit", () => {
    const base = {
      projectId: "6f1c2b4e-8d3a-4c7e-9b2f-1a2b3c4d5e6f",
      taskId: "0b9f6a52-3c1d-4e8f-9a7b-2c3d4e5f6a7b",
      date: "2026-11-20",
    };
    expect(weekCellSchema.parse({ ...base, duration: "1.5" }).duration).toBe(90);
    expect(weekCellSchema.parse({ ...base, duration: "" }).duration).toBeNull();
    expect(weekCellSchema.safeParse({ ...base, duration: "abc" }).success).toBe(false);
    expect(weekCellSchema.safeParse({ ...base }).success).toBe(false);
  });

  it("formats week ranges", () => {
    expect(formatWeekRange(days, "2026-11-20")).toBe("16 – 22 November");
    expect(formatWeekRange(weekDays("2026-12-01"), "2026-11-20")).toBe("30 November – 6 December");
    expect(formatWeekRange(weekDays("2025-06-11"), "2026-11-20")).toBe("9 – 15 June 2025");
  });
});

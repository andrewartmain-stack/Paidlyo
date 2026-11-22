import { describe, expect, it } from "vitest";
import { z } from "zod";
import { budgetDetail, budgetLabel, budgetProgress, budgetStatus, sumUsage } from "@/features/projects/budget";
import { resolveHourlyRate } from "@/features/projects/rates";
import {
  hoursToMinutes,
  minutesToHours,
  projectFiltersSchema,
  projectFormSchema,
  readProjectForm,
} from "@/features/projects/schemas";

const CLIENT = "6f1c2b4e-8d3a-4c7e-9b2f-1a2b3c4d5e6f";
const TASK_A = "0b9f6a52-3c1d-4e8f-9a7b-2c3d4e5f6a7b";
const TASK_B = "1c2d3e4f-5a6b-4c7d-8e9f-0a1b2c3d4e5f";

function form(fields: Record<string, string | string[]>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    for (const v of Array.isArray(value) ? value : [value]) data.append(key, v);
  }
  return readProjectForm(data);
}

const base = {
  clientId: CLIENT,
  name: "Website redesign",
  billingMethod: "project_rate",
  hourlyRate: "120",
  budgetKind: "none",
  taskIds: [TASK_A],
  [`billable:${TASK_A}`]: "on",
};

function errors(fields: Record<string, string | string[]>): Record<string, string[] | undefined> {
  const result = projectFormSchema.safeParse(form(fields));
  return result.success ? {} : z.flattenError(result.error).fieldErrors;
}

describe("projectFormSchema", () => {
  it("parses a project-rate project", () => {
    expect(projectFormSchema.parse(form(base))).toEqual({
      clientId: CLIENT,
      name: "Website redesign",
      code: null,
      billingMethod: "project_rate",
      hourlyRateCents: 12000,
      budgetMinutes: null,
      budgetCents: null,
      notes: null,
      tasks: [{ taskId: TASK_A, isBillable: true, hourlyRateCents: null }],
    });
  });

  it("requires a rate for project-rate billing", () => {
    expect(errors({ ...base, hourlyRate: "" }).hourlyRate).toBeDefined();
  });

  it("keeps per-task rates only for task-rate billing", () => {
    const parsed = projectFormSchema.parse(
      form({
        ...base,
        billingMethod: "task_rate",
        taskIds: [TASK_A, TASK_B],
        [`rate:${TASK_A}`]: "95.50",
        [`rate:${TASK_B}`]: "",
      }),
    );
    expect(parsed.hourlyRateCents).toBeNull();
    expect(parsed.tasks).toEqual([
      { taskId: TASK_A, isBillable: true, hourlyRateCents: 9550 },
      { taskId: TASK_B, isBillable: false, hourlyRateCents: null },
    ]);
  });

  it("reports an invalid task rate under that task's field", () => {
    expect(errors({ ...base, billingMethod: "task_rate", [`rate:${TASK_A}`]: "x" })[`rate:${TASK_A}`]).toBeDefined();
  });

  it("makes every task non-billable on non-billable projects", () => {
    const parsed = projectFormSchema.parse(form({ ...base, billingMethod: "none" }));
    expect(parsed.tasks[0].isBillable).toBe(false);
    expect(parsed.hourlyRateCents).toBeNull();
  });

  it("parses hour and amount budgets, and validates them", () => {
    expect(projectFormSchema.parse(form({ ...base, budgetKind: "hours", budgetHours: "7.5" })).budgetMinutes).toBe(450);
    expect(projectFormSchema.parse(form({ ...base, budgetKind: "amount", budgetAmount: "5,000" })).budgetCents).toBe(500000);
    expect(errors({ ...base, budgetKind: "hours", budgetHours: "0" }).budgetHours).toBeDefined();
    expect(errors({ ...base, budgetKind: "amount", budgetAmount: "0" }).budgetAmount).toBeDefined();
  });

  it("ignores budget values when no budget is chosen", () => {
    const parsed = projectFormSchema.parse(form({ ...base, budgetHours: "10", budgetAmount: "100" }));
    expect(parsed.budgetMinutes).toBeNull();
    expect(parsed.budgetCents).toBeNull();
  });

  it("requires a client, a name and at least one task", () => {
    const fieldErrors = errors({ ...base, clientId: "", name: " ", taskIds: [] });
    expect(Object.keys(fieldErrors)).toEqual(expect.arrayContaining(["clientId", "name", "tasks"]));
  });

  it("accepts person_rate without a project rate and dedupes task ids", () => {
    const parsed = projectFormSchema.parse(form({ ...base, billingMethod: "person_rate", hourlyRate: "" }));
    expect(parsed.billingMethod).toBe("person_rate");
    expect(parsed.hourlyRateCents).toBeNull();
    expect(form({ ...base, taskIds: [TASK_A, TASK_A] }).tasks).toHaveLength(1);
  });
});

describe("hours helpers", () => {
  it("converts hours to minutes and back", () => {
    expect(hoursToMinutes("40")).toBe(2400);
    expect(hoursToMinutes("1,25")).toBe(75);
    expect(hoursToMinutes("abc")).toBeNull();
    expect(minutesToHours(450)).toBe("7.5");
  });
});

describe("projectFiltersSchema", () => {
  it("drops an invalid client id", () => {
    expect(projectFiltersSchema.parse({ client: "x", status: "archived" })).toEqual({
      status: "archived",
      q: "",
      client: undefined,
    });
  });
});

describe("resolveHourlyRate", () => {
  const task = { isBillable: true, hourlyRateCents: null };
  it("uses the project rate for project-rate billing", () => {
    expect(
      resolveHourlyRate({ billingMethod: "project_rate", projectRateCents: 10000, projectTask: task, taskDefaultRateCents: 5000 }),
    ).toBe(10000);
  });
  it("uses the override, then the task default, for task-rate billing", () => {
    const args = { billingMethod: "task_rate" as const, projectRateCents: 10000, taskDefaultRateCents: 5000 };
    expect(resolveHourlyRate({ ...args, projectTask: { isBillable: true, hourlyRateCents: 7000 } })).toBe(7000);
    expect(resolveHourlyRate({ ...args, projectTask: task })).toBe(5000);
  });
  it("uses the person's own rate for person-rate billing", () => {
    const args = { billingMethod: "person_rate" as const, projectRateCents: 10000, projectTask: task, taskDefaultRateCents: 5000 };
    expect(resolveHourlyRate({ ...args, personRateCents: 12000 })).toBe(12000);
    expect(resolveHourlyRate(args)).toBeNull();
  });
  it("returns null for non-billable work", () => {
    expect(
      resolveHourlyRate({ billingMethod: "none", projectRateCents: 10000, projectTask: task, taskDefaultRateCents: 5000 }),
    ).toBeNull();
    expect(
      resolveHourlyRate({
        billingMethod: "project_rate",
        projectRateCents: 10000,
        projectTask: { isBillable: false, hourlyRateCents: null },
        taskDefaultRateCents: null,
      }),
    ).toBeNull();
  });
});

describe("project budgets", () => {
  const now = Date.parse("2026-11-22T12:00:00Z");
  const entries = [
    { projectId: "p1", minutes: 120, timerStartedAt: null, isBillable: true, hourlyRateCents: 10_000 },
    { projectId: "p1", minutes: 60, timerStartedAt: "2026-11-22T11:30:00Z", isBillable: true, hourlyRateCents: 10_000 },
    { projectId: "p1", minutes: 60, timerStartedAt: null, isBillable: false, hourlyRateCents: null },
    { projectId: "p2", minutes: 30, timerStartedAt: null, isBillable: true, hourlyRateCents: 8_000 },
  ];

  it("sums all minutes (running timers included) and the billable amount per project", () => {
    const usage = sumUsage(entries, now);
    expect(usage.get("p1")).toEqual({ minutes: 270, amountCents: 35_000 });
    expect(usage.get("p2")).toEqual({ minutes: 30, amountCents: 4_000 });
  });

  it("measures hours or amount budgets and flags 80% and over", () => {
    const usage = sumUsage(entries, now).get("p1");
    const hours = budgetProgress({ budgetMinutes: 300, budgetCents: null }, usage);
    expect(hours).toMatchObject({ kind: "hours", pct: 90, status: "warning" });
    expect(budgetLabel(hours!, "USD")).toBe("4.5 of 5 h");
    expect(budgetDetail(hours!, "USD")).toBe("90% used");

    const amount = budgetProgress({ budgetMinutes: null, budgetCents: 30_000 }, usage);
    expect(amount).toMatchObject({ kind: "amount", pct: 116, status: "over" });
    expect(budgetDetail(amount!, "USD")).toBe("Over by $50.00");

    expect(budgetProgress({ budgetMinutes: null, budgetCents: null }, usage)).toBeNull();
    expect(budgetProgress({ budgetMinutes: 600, budgetCents: null }, undefined)).toMatchObject({ pct: 0, status: "ok" });
  });

  it("uses 80% as the warning level and over 100% as over budget", () => {
    expect(budgetStatus(79)).toBe("ok");
    expect(budgetStatus(80)).toBe("warning");
    expect(budgetStatus(100)).toBe("warning");
    expect(budgetStatus(101)).toBe("over");
  });
});

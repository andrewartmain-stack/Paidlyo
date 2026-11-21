import { describe, expect, it } from "vitest";
import { z } from "zod";
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

  it("rejects person_rate (not offered yet) and dedupes task ids", () => {
    expect(errors({ ...base, billingMethod: "person_rate" }).billingMethod).toBeDefined();
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

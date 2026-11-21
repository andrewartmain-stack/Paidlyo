import { z } from "zod";
import {
  archiveStatusSchema,
  optionalAmountCents,
  optionalText,
} from "@/lib/form-schemas";
import { toCents } from "@/lib/money";
import { BILLING_METHODS } from "./types";

export const BUDGET_KINDS = ["none", "hours", "amount"] as const;
export type BudgetKind = (typeof BUDGET_KINDS)[number];

const MAX_BUDGET_HOURS = 100_000;
const MAX_TASKS = 200;

/** "7.5" or "7,5" hours → 450 minutes; null when not a positive number of hours. */
export function hoursToMinutes(input: string): number | null {
  const value = input.trim().replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(value)) return null;
  const hundredths = toCents(value);
  if (hundredths === null || hundredths <= 0) return null;
  return Math.round((hundredths * 60) / 100);
}

/** 450 minutes → "7.5" (for form defaults and display). */
export function minutesToHours(minutes: number): string {
  return String(Math.round((minutes / 60) * 100) / 100);
}

/**
 * Turns the project form's FormData into a plain object for `projectFormSchema`.
 * Tasks are submitted as `taskIds` (checked) plus `billable:<id>` and `rate:<id>` per task.
 */
export function readProjectForm(formData: FormData) {
  const text = (key: string) => {
    const value = formData.get(key);
    return typeof value === "string" ? value : "";
  };
  const taskIds = [
    ...new Set(formData.getAll("taskIds").filter((v): v is string => typeof v === "string")),
  ];

  return {
    clientId: text("clientId"),
    name: text("name"),
    code: text("code"),
    billingMethod: text("billingMethod"),
    hourlyRate: text("hourlyRate"),
    budgetKind: text("budgetKind"),
    budgetHours: text("budgetHours"),
    budgetAmount: text("budgetAmount"),
    notes: text("notes"),
    tasks: taskIds.map((taskId) => ({
      taskId,
      isBillable: formData.get(`billable:${taskId}`) === "on",
      hourlyRate: text(`rate:${taskId}`),
    })),
  };
}

export const projectFormSchema = z
  .object({
    clientId: z.uuid("Choose a client."),
    name: z.string().trim().min(1, "Enter a project name.").max(200, "Name is too long."),
    code: optionalText(30, "Use at most 30 characters."),
    billingMethod: z.enum(BILLING_METHODS, "Choose how this project is billed."),
    hourlyRate: z.string(),
    budgetKind: z.enum(BUDGET_KINDS).catch("none"),
    budgetHours: z.string(),
    budgetAmount: z.string(),
    notes: optionalText(2000, "Notes are too long."),
    tasks: z
      .array(z.object({ taskId: z.uuid(), isBillable: z.boolean(), hourlyRate: z.string() }))
      .min(1, "Add at least one task.")
      .max(MAX_TASKS, "Too many tasks."),
  })
  .transform((v, ctx) => {
    const amount = (input: string, path: string, required: string | null) => {
      const parsed = optionalAmountCents.safeParse(input);
      if (!parsed.success) {
        ctx.addIssue({ code: "custom", path: [path], message: parsed.error.issues[0].message });
        return null;
      }
      if (parsed.data === null && required) {
        ctx.addIssue({ code: "custom", path: [path], message: required });
      }
      return parsed.data;
    };

    const hourlyRateCents =
      v.billingMethod === "project_rate"
        ? amount(v.hourlyRate, "hourlyRate", "Enter the project's hourly rate.")
        : null;

    let budgetMinutes: number | null = null;
    let budgetCents: number | null = null;
    if (v.budgetKind === "hours") {
      budgetMinutes = hoursToMinutes(v.budgetHours);
      if (budgetMinutes === null || budgetMinutes > MAX_BUDGET_HOURS * 60) {
        ctx.addIssue({ code: "custom", path: ["budgetHours"], message: "Enter hours like 40 or 7.5." });
      }
    } else if (v.budgetKind === "amount") {
      budgetCents = amount(v.budgetAmount, "budgetAmount", "Enter the budget amount.");
      if (budgetCents === 0) {
        ctx.addIssue({ code: "custom", path: ["budgetAmount"], message: "The budget must be above 0." });
      }
    }

    const tasks = v.tasks.map((task) => ({
      taskId: task.taskId,
      isBillable: v.billingMethod !== "none" && task.isBillable,
      hourlyRateCents:
        v.billingMethod === "task_rate" ? amount(task.hourlyRate, `rate:${task.taskId}`, null) : null,
    }));

    return {
      clientId: v.clientId,
      name: v.name,
      code: v.code,
      billingMethod: v.billingMethod,
      hourlyRateCents,
      budgetMinutes,
      budgetCents,
      notes: v.notes,
      tasks,
    };
  });

export type ProjectInput = z.output<typeof projectFormSchema>;

export const projectIdSchema = z.uuid();

export const projectFiltersSchema = z.object({
  status: archiveStatusSchema,
  q: z.string().trim().max(100).catch("").default(""),
  client: z.uuid().optional().catch(undefined),
});
export type ProjectFilters = z.infer<typeof projectFiltersSchema>;

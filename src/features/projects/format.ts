import { formatMoney } from "@/lib/money";
import { minutesToHours } from "./schemas";
import type { ProjectListItem } from "./types";

export const BILLING_METHOD_LABELS = {
  project_rate: "Project hourly rate",
  task_rate: "Task hourly rate",
  person_rate: "Person hourly rate",
  none: "Non-billable",
} as const;

export function billingSummary(project: ProjectListItem): string {
  if (project.billingMethod === "project_rate" && project.hourlyRateCents !== null) {
    return `${formatMoney(project.hourlyRateCents, project.client.currency)}/h`;
  }
  return BILLING_METHOD_LABELS[project.billingMethod];
}

export function budgetSummary(project: ProjectListItem): string | null {
  if (project.budgetMinutes !== null) return `${minutesToHours(project.budgetMinutes)} h`;
  if (project.budgetCents !== null) return formatMoney(project.budgetCents, project.client.currency);
  return null;
}

import type { Enums } from "@/types/database";

export type BillingMethod = Enums<"billing_method">;

/** Billing methods offered in the UI. person_rate uses each member's rate (Team page). */
export const BILLING_METHODS = ["project_rate", "task_rate", "person_rate", "none"] as const;
export type SelectableBillingMethod = (typeof BILLING_METHODS)[number];

export type ProjectListItem = {
  id: string;
  name: string;
  code: string | null;
  billingMethod: BillingMethod;
  hourlyRateCents: number | null;
  budgetMinutes: number | null;
  budgetCents: number | null;
  archivedAt: string | null;
  client: { id: string; name: string; currency: string };
};

export type ProjectTaskSetting = {
  taskId: string;
  isBillable: boolean;
  hourlyRateCents: number | null;
};

export type ProjectDetail = Omit<ProjectListItem, "client"> & {
  clientId: string;
  notes: string | null;
  tasks: ProjectTaskSetting[];
};

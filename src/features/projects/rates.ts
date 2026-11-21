import type { BillingMethod } from "./types";

/**
 * The hourly rate (cents) for time on a project task, following Harvest's billing methods.
 * Returns null when the time is not billable or no rate is set.
 * person_rate arrives with team members (roadmap item 14); until then it has no rate.
 * Keep in sync with the DB trigger `time_entries_set_rate`, which snapshots the rate on entries.
 */
export function resolveHourlyRate({
  billingMethod,
  projectRateCents,
  projectTask,
  taskDefaultRateCents,
}: {
  billingMethod: BillingMethod;
  projectRateCents: number | null;
  projectTask: { isBillable: boolean; hourlyRateCents: number | null };
  taskDefaultRateCents: number | null;
}): number | null {
  if (billingMethod === "none" || !projectTask.isBillable) return null;
  if (billingMethod === "project_rate") return projectRateCents;
  if (billingMethod === "task_rate") return projectTask.hourlyRateCents ?? taskDefaultRateCents;
  return null;
}

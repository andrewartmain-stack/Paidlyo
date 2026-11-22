import type { BillingMethod } from "./types";

/**
 * The hourly rate (cents) for time on a project task, following Harvest's billing methods.
 * Returns null when the time is not billable or no rate is set.
 * person_rate uses the rate of the person who logged the time (null when they have none).
 * Keep in sync with the DB trigger `time_entries_set_rate`, which snapshots the rate on entries.
 */
export function resolveHourlyRate({
  billingMethod,
  projectRateCents,
  projectTask,
  taskDefaultRateCents,
  personRateCents = null,
}: {
  billingMethod: BillingMethod;
  projectRateCents: number | null;
  projectTask: { isBillable: boolean; hourlyRateCents: number | null };
  taskDefaultRateCents: number | null;
  personRateCents?: number | null;
}): number | null {
  if (billingMethod === "none" || !projectTask.isBillable) return null;
  if (billingMethod === "project_rate") return projectRateCents;
  if (billingMethod === "task_rate") return projectTask.hourlyRateCents ?? taskDefaultRateCents;
  return personRateCents;
}

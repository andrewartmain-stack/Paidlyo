import { z } from "zod";
import { isoDateSchema } from "@/features/time/schemas";
import { isIsoDate, weekStart } from "@/features/time/dates";
import { REVIEW_ACTIONS, TIMESHEET_STATUSES } from "./rules";

/** A week, given as its Monday. */
export const weekStartSchema = isoDateSchema.refine(
  (iso) => isIsoDate(iso) && weekStart(iso) === iso,
  "Choose a week starting on Monday.",
);

export const reviewSchema = z.object({
  id: z.uuid(),
  action: z.enum(REVIEW_ACTIONS),
  note: z.string().trim().max(1000, "The note is too long."),
});

export const approvalsTabSchema = z.object({
  status: z.enum(TIMESHEET_STATUSES).catch("submitted").default("submitted"),
});

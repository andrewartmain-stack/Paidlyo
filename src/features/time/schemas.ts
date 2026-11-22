import { z } from "zod";
import { optionalText } from "@/lib/form-schemas";
import { isIsoDate } from "./dates";
import { MAX_ENTRY_MINUTES, parseDuration } from "./duration";

export const isoDateSchema = z.string().refine(isIsoDate, "Choose a valid date.");

/**
 * Duration field: blank → null (start a timer / 0:00); missing (disabled input while a timer
 * runs) → undefined, meaning "leave minutes unchanged".
 */
const duration = z
  .string()
  .optional()
  .transform((value, ctx) => {
    if (value === undefined) return undefined;
    if (value.trim() === "") return null;
    const minutes = parseDuration(value);
    if (minutes === null) {
      ctx.addIssue({ code: "custom", message: "Enter a duration like 1:30 or 1.5." });
      return z.NEVER;
    }
    if (minutes > MAX_ENTRY_MINUTES) {
      ctx.addIssue({ code: "custom", message: "An entry can be at most 24 hours." });
      return z.NEVER;
    }
    return minutes;
  });

export const timeEntrySchema = z.object({
  projectId: z.uuid("Choose a project."),
  taskId: z.uuid("Choose a task."),
  spentDate: isoDateSchema,
  notes: optionalText(2000, "Notes are too long.").optional().transform((v) => v ?? null),
  duration,
});

export type TimeEntryInput = z.output<typeof timeEntrySchema>;

export const timeEntryIdSchema = z.uuid();

export const TIMESHEET_VIEWS = ["day", "week"] as const;
export type TimesheetView = (typeof TIMESHEET_VIEWS)[number];

export const timesheetParamsSchema = z.object({
  date: isoDateSchema.optional().catch(undefined),
  view: z.enum(TIMESHEET_VIEWS).catch("day").default("day"),
  track: z.literal("1").optional().catch(undefined),
});

/** One week-grid cell edit. */
export const weekCellSchema = z.object({
  projectId: z.uuid(),
  taskId: z.uuid(),
  date: isoDateSchema,
  duration: duration.pipe(z.number().nullable()),
});
export type WeekCellInput = z.input<typeof weekCellSchema>;

/** Day view "Copy from …": copy one earlier day's entries (at 0:00) onto an empty day. */
export const copyDaySchema = z
  .object({ fromDate: isoDateSchema, toDate: isoDateSchema })
  .refine((v) => v.fromDate < v.toDate, "Choose an earlier day to copy from.");

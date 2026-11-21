import { z } from "zod";
import { archiveStatusSchema, checkbox, optionalAmountCents } from "@/lib/form-schemas";

export const taskSchema = z.object({
  name: z.string().trim().min(1, "Enter a task name.").max(100, "Name is too long."),
  defaultHourlyRateCents: optionalAmountCents,
  isBillable: checkbox,
  isCommon: checkbox,
});

export type TaskInput = z.infer<typeof taskSchema>;

export const taskIdSchema = z.uuid();

export const taskFiltersSchema = z.object({ status: archiveStatusSchema });
export type TaskFilters = z.infer<typeof taskFiltersSchema>;

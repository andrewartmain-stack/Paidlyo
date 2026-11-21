import { z } from "zod";

export const REPORT_PERIODS = [
  { value: "this_week", label: "This week" },
  { value: "last_week", label: "Last week" },
  { value: "this_month", label: "This month" },
  { value: "last_month", label: "Last month" },
  { value: "this_year", label: "This year" },
  { value: "custom", label: "Custom" },
] as const;
export type ReportPeriod = (typeof REPORT_PERIODS)[number]["value"];
const PERIOD_VALUES = REPORT_PERIODS.map((p) => p.value) as [ReportPeriod, ...ReportPeriod[]];
export const DEFAULT_PERIOD: ReportPeriod = "this_month";

export const REPORT_GROUPS = [
  { value: "client", label: "Clients", column: "Client" },
  { value: "project", label: "Projects", column: "Project" },
  { value: "task", label: "Tasks", column: "Task" },
] as const;
export type ReportGroup = (typeof REPORT_GROUPS)[number]["value"];
const GROUP_VALUES = REPORT_GROUPS.map((g) => g.value) as [ReportGroup, ...ReportGroup[]];
export const DEFAULT_GROUP: ReportGroup = "client";

/** Report filters from the URL; anything invalid falls back to the defaults. */
export const reportFiltersSchema = z.object({
  period: z.enum(PERIOD_VALUES).catch(DEFAULT_PERIOD),
  from: z.string().optional().catch(undefined),
  to: z.string().optional().catch(undefined),
  group: z.enum(GROUP_VALUES).catch(DEFAULT_GROUP),
});
export type ReportFilters = z.output<typeof reportFiltersSchema>;

export const REPORT_KINDS = ["time", "unbilled", "outstanding"] as const;
export type ReportKind = (typeof REPORT_KINDS)[number];
/** ?report= on the CSV export; time by default so 11a links keep working. */
export const reportKindSchema = z.enum(REPORT_KINDS).catch("time");

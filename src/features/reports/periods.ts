import { addDays, isIsoDate, weekStart } from "@/features/time/dates";
import { DEFAULT_GROUP, DEFAULT_PERIOD, type ReportFilters, type ReportGroup, type ReportPeriod } from "./schemas";

/** A resolved report period: inclusive ISO dates. */
export type ReportRange = { period: ReportPeriod; from: string; to: string };

function firstOfMonth(year: number, month: number): string {
  // month is 1-based and may overflow (13 → January next year, 0 → December last year).
  const date = new Date(Date.UTC(year, month - 1, 1));
  return date.toISOString().slice(0, 10);
}

function monthRange(year: number, month: number): { from: string; to: string } {
  return { from: firstOfMonth(year, month), to: addDays(firstOfMonth(year, month + 1), -1) };
}

/**
 * Dates for a preset period around `today` (org timezone, weeks start Monday). A custom period
 * with missing or invalid dates, or an end before the start, falls back to the default period.
 */
export function resolveReportRange(filters: Pick<ReportFilters, "period" | "from" | "to">, today: string): ReportRange {
  const year = Number(today.slice(0, 4));
  const month = Number(today.slice(5, 7));

  switch (filters.period) {
    case "this_week": {
      const from = weekStart(today);
      return { period: "this_week", from, to: addDays(from, 6) };
    }
    case "last_week": {
      const from = addDays(weekStart(today), -7);
      return { period: "last_week", from, to: addDays(from, 6) };
    }
    case "this_month":
      return { period: "this_month", ...monthRange(year, month) };
    case "last_month":
      return { period: "last_month", ...monthRange(year, month - 1) };
    case "this_year":
      return { period: "this_year", from: `${year}-01-01`, to: `${year}-12-31` };
    case "custom": {
      const { from, to } = filters;
      if (from && to && isIsoDate(from) && isIsoDate(to) && from <= to) return { period: "custom", from, to };
      return resolveReportRange({ period: DEFAULT_PERIOD }, today);
    }
  }
}

/** Query string for a report view; defaults are left out so the plain URL is the default view. */
export function reportQuery(range: ReportRange, group: ReportGroup): string {
  const params = new URLSearchParams();
  if (range.period !== DEFAULT_PERIOD) params.set("period", range.period);
  if (range.period === "custom") {
    params.set("from", range.from);
    params.set("to", range.to);
  }
  if (group !== DEFAULT_GROUP) params.set("group", group);
  return params.toString();
}

export function reportHref(path: string, range: ReportRange, group: ReportGroup): string {
  const query = reportQuery(range, group);
  return query ? `${path}?${query}` : path;
}

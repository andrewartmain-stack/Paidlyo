/* Timesheet approval rules (pure, shared by pages, actions and tests). */
import type { Enums } from "@/types/database";

export type TimesheetStatus = Enums<"timesheet_status">;

export const TIMESHEET_STATUSES = ["submitted", "approved", "rejected"] as const satisfies readonly TimesheetStatus[];

export const STATUS_LABELS: Record<TimesheetStatus, string> = {
  submitted: "Waiting for approval",
  approved: "Approved",
  rejected: "Rejected",
};

/** Approvals page tabs. */
export const APPROVAL_TABS = [
  { status: "submitted", label: "Pending" },
  { status: "approved", label: "Approved" },
  { status: "rejected", label: "Rejected" },
] as const satisfies readonly { status: TimesheetStatus; label: string }[];

export const REVIEW_ACTIONS = ["approve", "reject", "reopen"] as const;
export type ReviewAction = (typeof REVIEW_ACTIONS)[number];

/** Mirrors the DB lock: with approvals on, submitted and approved weeks can't change. */
export function isWeekLocked(status: TimesheetStatus | null, approvalsOn: boolean): boolean {
  return approvalsOn && (status === "submitted" || status === "approved");
}

/** Which review actions a manager can take on a week in this status. */
export function reviewActions(status: TimesheetStatus): ReviewAction[] {
  if (status === "submitted") return ["approve", "reject"];
  if (status === "approved") return ["reopen"];
  return [];
}

export type SummaryEntry = {
  minutes: number;
  isBillable: boolean;
  projectName: string;
  clientName: string;
  taskName: string;
};

export type WeekSummary = {
  minutes: number;
  billableMinutes: number;
  /** Hours per project + task, biggest first. */
  lines: { label: string; minutes: number }[];
};

export function summarizeWeek(entries: SummaryEntry[]): WeekSummary {
  const lines = new Map<string, number>();
  let minutes = 0;
  let billableMinutes = 0;
  for (const entry of entries) {
    minutes += entry.minutes;
    if (entry.isBillable) billableMinutes += entry.minutes;
    const label = `${entry.projectName} (${entry.clientName}) · ${entry.taskName}`;
    lines.set(label, (lines.get(label) ?? 0) + entry.minutes);
  }
  return {
    minutes,
    billableMinutes,
    lines: [...lines.entries()]
      .map(([label, total]) => ({ label, minutes: total }))
      .sort((a, b) => b.minutes - a.minutes || a.label.localeCompare(b.label)),
  };
}

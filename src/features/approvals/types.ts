import type { TimesheetStatus, WeekSummary } from "./rules";

export type WeekSubmission = {
  id: string;
  userId: string;
  weekStart: string;
  status: TimesheetStatus;
  submittedAt: string;
  decidedAt: string | null;
  decidedByName: string | null;
  note: string | null;
};

/** A row on the approvals page. */
export type SubmissionRow = WeekSubmission & { personName: string; summary: WeekSummary };

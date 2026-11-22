import "server-only";
import { createClient } from "@/lib/supabase/server";
import { fetchAllRows } from "@/lib/supabase/fetch-all";
import { addDays, weekStart } from "@/features/time/dates";
import { summarizeWeek, type SummaryEntry, type TimesheetStatus } from "./rules";
import type { SubmissionRow, WeekSubmission } from "./types";

const SUBMISSION_COLUMNS = "id, user_id, week_start, status, submitted_at, decided_at, decided_by, note";
const MAX_ROWS = 100;
const MAX_ENTRIES = 50_000;

type SubmissionRecord = {
  id: string;
  user_id: string;
  week_start: string;
  status: TimesheetStatus;
  submitted_at: string;
  decided_at: string | null;
  decided_by: string | null;
  note: string | null;
};

async function profileNames(userIds: string[]): Promise<Map<string, string>> {
  const names = new Map<string, string>();
  if (userIds.length === 0) return names;
  const supabase = await createClient();
  const { data, error } = await supabase.from("profiles").select("id, full_name, email").in("id", userIds);
  if (error) throw new Error("Could not load people.");
  for (const p of data) names.set(p.id, p.full_name.trim() || p.email);
  return names;
}

function toSubmission(row: SubmissionRecord, names: Map<string, string>): WeekSubmission {
  return {
    id: row.id,
    userId: row.user_id,
    weekStart: row.week_start,
    status: row.status,
    submittedAt: row.submitted_at,
    decidedAt: row.decided_at,
    decidedByName: row.decided_by ? (names.get(row.decided_by) ?? null) : null,
    note: row.note,
  };
}

/** One person's submission for a week (RLS: own, or owners/admins), or null. */
export async function getWeekSubmission(orgId: string, userId: string, week: string): Promise<WeekSubmission | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("timesheet_submissions")
    .select(SUBMISSION_COLUMNS)
    .eq("organization_id", orgId)
    .eq("user_id", userId)
    .eq("week_start", week)
    .maybeSingle();
  if (error) throw new Error("Could not load the week's approval status.");
  if (!data) return null;
  const names = await profileNames(data.decided_by ? [data.decided_by] : []);
  return toSubmission(data, names);
}

/** Weeks in one status with hour totals (owners/admins), newest week first. */
export async function listSubmissions(orgId: string, status: TimesheetStatus): Promise<SubmissionRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("timesheet_submissions")
    .select(SUBMISSION_COLUMNS)
    .eq("organization_id", orgId)
    .eq("status", status)
    .order("week_start", { ascending: status === "submitted" })
    .order("submitted_at")
    .limit(MAX_ROWS);
  if (error) throw new Error("Could not load timesheets.");
  if (data.length === 0) return [];

  const userIds = [...new Set(data.map((row) => row.user_id))];
  const weeks = data.map((row) => row.week_start).sort();
  const [names, { rows: entries }] = await Promise.all([
    profileNames([...new Set([...userIds, ...data.flatMap((row) => (row.decided_by ? [row.decided_by] : []))])]),
    fetchAllRows(
      (from, to) =>
        supabase
          .from("time_entries")
          .select(
            "id, user_id, spent_date, minutes, is_billable, project:projects!time_entries_project_fkey(name, client:clients!projects_client_fkey(name)), task:tasks!time_entries_task_fkey(name)",
          )
          .eq("organization_id", orgId)
          .in("user_id", userIds)
          .gte("spent_date", weeks[0])
          .lte("spent_date", addDays(weeks[weeks.length - 1], 6))
          .order("id")
          .range(from, to),
      MAX_ENTRIES,
    ),
  ]);

  const byWeek = new Map<string, SummaryEntry[]>();
  for (const entry of entries) {
    const key = `${entry.user_id}:${weekStart(entry.spent_date)}`;
    const list = byWeek.get(key) ?? [];
    list.push({
      minutes: entry.minutes,
      isBillable: entry.is_billable,
      projectName: entry.project.name,
      clientName: entry.project.client.name,
      taskName: entry.task.name,
    });
    byWeek.set(key, list);
  }

  return data.map((row) => ({
    ...toSubmission(row, names),
    personName: names.get(row.user_id) ?? "Unknown",
    summary: summarizeWeek(byWeek.get(`${row.user_id}:${row.week_start}`) ?? []),
  }));
}

/** Weeks waiting for approval (dashboard). */
export async function countPendingSubmissions(orgId: string): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("timesheet_submissions")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", orgId)
    .eq("status", "submitted");
  if (error) return 0;
  return count ?? 0;
}

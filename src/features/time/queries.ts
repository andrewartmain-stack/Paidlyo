import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/features/auth/queries";
import { getCurrentOrg } from "@/features/organizations/queries";
import { liveMinutes } from "./duration";
import type { TimeEntry, TrackableProject } from "./types";

const ENTRY_COLUMNS = `id, spent_date, minutes, notes, is_billable, timer_started_at, invoice_item_id,
  project:projects!time_entries_project_fkey(id, name, code, client:clients!projects_client_fkey(name)),
  task:tasks!time_entries_task_fkey(id, name)`;

/**
 * The signed-in user's entries between two dates (inclusive), oldest first.
 * Reads the session — call inside a <Suspense> boundary.
 */
export async function listMyEntries(from: string, to: string): Promise<TimeEntry[]> {
  const [org, user] = await Promise.all([getCurrentOrg(), getCurrentUser()]);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("time_entries")
    .select(ENTRY_COLUMNS)
    .eq("organization_id", org.id)
    .eq("user_id", user.id)
    .gte("spent_date", from)
    .lte("spent_date", to)
    .order("spent_date")
    .order("created_at");
  if (error) throw new Error("Could not load time entries.");

  return data.map((row) => ({
    id: row.id,
    spentDate: row.spent_date,
    minutes: row.minutes,
    notes: row.notes,
    isBillable: row.is_billable,
    timerStartedAt: row.timer_started_at,
    invoiced: row.invoice_item_id !== null,
    project: {
      id: row.project.id,
      name: row.project.name,
      code: row.project.code,
      clientName: row.project.client.name,
    },
    task: row.task,
  }));
}

/** Total minutes per date (running timers counted up to `nowMs`). */
export function totalsByDate(entries: TimeEntry[], nowMs: number): Map<string, number> {
  const totals = new Map<string, number>();
  for (const entry of entries) {
    const minutes = liveMinutes(entry.minutes, entry.timerStartedAt, nowMs);
    totals.set(entry.spentDate, (totals.get(entry.spentDate) ?? 0) + minutes);
  }
  return totals;
}

/**
 * The signed-in user's entries for a week plus per-day totals. `nowMs` is the moment totals
 * were measured; pass it to live timers so server and client render the same value.
 */
export async function getWeekSheet(days: string[]) {
  const entries = await listMyEntries(days[0], days[days.length - 1]);
  const nowMs = Date.now();
  return { entries, totals: totalsByDate(entries, nowMs), nowMs };
}

/** Active projects with their active tasks, sorted by client then project. */
export async function listTrackableProjects(): Promise<TrackableProject[]> {
  const org = await getCurrentOrg();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("projects")
    .select(
      "id, name, code, client:clients!projects_client_fkey(name), project_tasks(task:tasks!project_tasks_task_fkey(id, name, archived_at))",
    )
    .eq("organization_id", org.id)
    .is("archived_at", null);
  if (error) throw new Error("Could not load projects.");

  return data
    .map((row) => ({
      id: row.id,
      name: row.name,
      code: row.code,
      clientName: row.client.name,
      tasks: row.project_tasks
        .map((pt) => pt.task)
        .filter((task) => task.archived_at === null)
        .map(({ id, name }) => ({ id, name }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .filter((project) => project.tasks.length > 0)
    .sort((a, b) => a.clientName.localeCompare(b.clientName) || a.name.localeCompare(b.name));
}

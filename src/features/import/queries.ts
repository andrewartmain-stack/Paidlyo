import "server-only";
import { fetchAllRows } from "@/lib/supabase/fetch-all";
import { createClient } from "@/lib/supabase/server";
import type { ExistingData } from "./plan";

const MAX_ROWS = 500_000;

/**
 * Clients, projects (active first, so a name shared with an archived project matches the active
 * one), tasks, project tasks and import keys of the org (owners/admins).
 */
export async function loadExistingData(orgId: string): Promise<ExistingData> {
  const supabase = await createClient();
  const [clients, projects, tasks, projectTasks, keys] = await Promise.all([
    fetchAllRows(
      (from, to) => supabase.from("clients").select("id, name").eq("organization_id", orgId).order("created_at").order("id").range(from, to),
      MAX_ROWS,
    ),
    fetchAllRows(
      (from, to) =>
        supabase
          .from("projects")
          .select("id, client_id, name, archived_at")
          .eq("organization_id", orgId)
          .order("archived_at", { nullsFirst: true })
          .order("created_at")
          .order("id")
          .range(from, to),
      MAX_ROWS,
    ),
    fetchAllRows(
      (from, to) => supabase.from("tasks").select("id, name").eq("organization_id", orgId).order("created_at").order("id").range(from, to),
      MAX_ROWS,
    ),
    fetchAllRows(
      (from, to) =>
        supabase.from("project_tasks").select("id, project_id, task_id").eq("organization_id", orgId).order("id").range(from, to),
      MAX_ROWS,
    ),
    fetchAllRows(
      (from, to) =>
        supabase
          .from("time_entries")
          .select("id, import_key")
          .eq("organization_id", orgId)
          .not("import_key", "is", null)
          .order("id")
          .range(from, to),
      MAX_ROWS,
    ),
  ]);

  return {
    clients: clients.rows,
    projects: projects.rows.map((p) => ({ id: p.id, clientId: p.client_id, name: p.name, archived: p.archived_at !== null })),
    tasks: tasks.rows,
    projectTasks: projectTasks.rows.map((pt) => ({ projectId: pt.project_id, taskId: pt.task_id })),
    importKeys: new Set(keys.rows.flatMap((row) => (row.import_key ? [row.import_key] : []))),
  };
}

import "server-only";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { escapeLike } from "@/lib/form-schemas";
import { getCurrentOrg } from "@/features/organizations/queries";
import { projectIdSchema, type ProjectFilters } from "./schemas";
import type { ProjectDetail, ProjectListItem } from "./types";

const LIST_COLUMNS =
  "id, name, code, billing_method, hourly_rate_cents, budget_minutes, budget_cents, archived_at, client:clients!projects_client_fkey(id, name, currency)";

/**
 * Projects of the current organization, sorted by client then project name.
 * Reads the session — call inside a <Suspense> boundary.
 */
export async function listProjects(filters: ProjectFilters): Promise<ProjectListItem[]> {
  const org = await getCurrentOrg();
  const supabase = await createClient();

  let query = supabase.from("projects").select(LIST_COLUMNS).eq("organization_id", org.id);
  query =
    filters.status === "archived"
      ? query.not("archived_at", "is", null)
      : query.is("archived_at", null);
  if (filters.client) query = query.eq("client_id", filters.client);
  if (filters.q) query = query.ilike("name", `%${escapeLike(filters.q)}%`);

  const { data, error } = await query.order("name");
  if (error) throw new Error("Could not load projects.");

  return data
    .map((row) => ({
      id: row.id,
      name: row.name,
      code: row.code,
      billingMethod: row.billing_method,
      hourlyRateCents: row.hourly_rate_cents,
      budgetMinutes: row.budget_minutes,
      budgetCents: row.budget_cents,
      archivedAt: row.archived_at,
      client: row.client,
    }))
    .sort((a, b) => a.client.name.localeCompare(b.client.name) || a.name.localeCompare(b.name));
}

/** One project with its task settings, or a 404 when it doesn't exist in this organization. */
export async function getProject(id: string): Promise<ProjectDetail> {
  const projectId = projectIdSchema.safeParse(id);
  if (!projectId.success) notFound();

  const org = await getCurrentOrg();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select(
      "id, client_id, name, code, billing_method, hourly_rate_cents, budget_minutes, budget_cents, notes, archived_at, project_tasks(task_id, is_billable, hourly_rate_cents)",
    )
    .eq("id", projectId.data)
    .eq("organization_id", org.id)
    .maybeSingle();
  if (error) throw new Error("Could not load the project.");
  if (!data) notFound();

  return {
    id: data.id,
    clientId: data.client_id,
    name: data.name,
    code: data.code,
    billingMethod: data.billing_method,
    hourlyRateCents: data.hourly_rate_cents,
    budgetMinutes: data.budget_minutes,
    budgetCents: data.budget_cents,
    notes: data.notes,
    archivedAt: data.archived_at,
    tasks: data.project_tasks.map((pt) => ({
      taskId: pt.task_id,
      isBillable: pt.is_billable,
      hourlyRateCents: pt.hourly_rate_cents,
    })),
  };
}

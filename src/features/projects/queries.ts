import "server-only";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { escapeLike } from "@/lib/form-schemas";
import { fetchAllRows } from "@/lib/supabase/fetch-all";
import { getCurrentOrg } from "@/features/organizations/queries";
import { budgetProgress, sumUsage, type BudgetProgress, type BudgetUsage } from "./budget";
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

const MAX_BUDGET_ENTRIES = 100_000;

/**
 * Time logged on the given projects, for budget usage (owners/admins: RLS shows everyone's time;
 * for members it would only be their own, so call this for managers only).
 */
export async function listBudgetUsage(orgId: string, projectIds: string[], nowMs: number): Promise<Map<string, BudgetUsage>> {
  if (projectIds.length === 0) return new Map();
  const supabase = await createClient();
  const { rows } = await fetchAllRows(
    (from, to) =>
      supabase
        .from("time_entries")
        .select("id, project_id, minutes, timer_started_at, is_billable, hourly_rate_cents")
        .eq("organization_id", orgId)
        .in("project_id", projectIds)
        .order("id")
        .range(from, to),
    MAX_BUDGET_ENTRIES,
  );
  return sumUsage(
    rows.map((row) => ({
      projectId: row.project_id,
      minutes: row.minutes,
      timerStartedAt: row.timer_started_at,
      isBillable: row.is_billable,
      hourlyRateCents: row.hourly_rate_cents,
    })),
    nowMs,
  );
}

export type BudgetAlert = { projectId: string; projectName: string; clientName: string; progress: BudgetProgress };

/** Active projects at or above the warning level, most used first (owners/admins). */
export async function listBudgetAlerts(orgId: string, nowMs: number): Promise<BudgetAlert[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("id, name, budget_minutes, budget_cents, client:clients!projects_client_fkey(name)")
    .eq("organization_id", orgId)
    .is("archived_at", null)
    .or("budget_minutes.not.is.null,budget_cents.not.is.null");
  if (error) throw new Error("Could not load project budgets.");

  const usage = await listBudgetUsage(orgId, data.map((p) => p.id), nowMs);
  const alerts: BudgetAlert[] = [];
  for (const project of data) {
    const progress = budgetProgress(
      { budgetMinutes: project.budget_minutes, budgetCents: project.budget_cents },
      usage.get(project.id),
    );
    if (progress && progress.status !== "ok") {
      alerts.push({ projectId: project.id, projectName: project.name, clientName: project.client.name, progress });
    }
  }
  return alerts.sort((a, b) => b.progress.pct - a.progress.pct);
}

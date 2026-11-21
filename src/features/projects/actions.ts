"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import { writeBlocked } from "@/features/billing/guard";
import { canManageOrg, getCurrentOrg } from "@/features/organizations/queries";
import { projectFormSchema, projectIdSchema, readProjectForm, type ProjectInput } from "./schemas";

const NOT_ALLOWED = "Only owners and admins can manage projects.";
const NOT_FOUND = "This project no longer exists.";
const GENERIC_ERROR = "Something went wrong. Please try again.";

function revalidate() {
  revalidatePath("/app/projects", "layout");
}

async function managedOrg() {
  const org = await getCurrentOrg();
  return canManageOrg(org) ? org : null;
}

/**
 * Checks the client and tasks belong to the org and are active. Archived ones are allowed only
 * if the project already uses them (so editing an old project doesn't fail).
 */
async function checkReferences(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orgId: string,
  input: ProjectInput,
  projectId: string | null,
): Promise<Record<string, string[]> | null> {
  const existing = projectId
    ? await supabase
        .from("projects")
        .select("client_id, project_tasks(task_id)")
        .eq("id", projectId)
        .eq("organization_id", orgId)
        .maybeSingle()
    : null;
  const currentClientId = existing?.data?.client_id ?? null;
  const currentTaskIds = new Set(existing?.data?.project_tasks.map((pt) => pt.task_id) ?? []);

  const taskIds = input.tasks.map((t) => t.taskId);
  const [{ data: client }, { data: tasks }] = await Promise.all([
    supabase
      .from("clients")
      .select("id, archived_at")
      .eq("id", input.clientId)
      .eq("organization_id", orgId)
      .maybeSingle(),
    supabase.from("tasks").select("id, archived_at").eq("organization_id", orgId).in("id", taskIds),
  ]);

  const errors: Record<string, string[]> = {};
  if (!client || (client.archived_at && client.id !== currentClientId)) {
    errors.clientId = ["Choose an active client."];
  }
  const usable = new Set(
    (tasks ?? []).filter((t) => !t.archived_at || currentTaskIds.has(t.id)).map((t) => t.id),
  );
  if (taskIds.some((id) => !usable.has(id))) {
    errors.tasks = ["Some tasks are archived or no longer exist. Reload and try again."];
  }
  return Object.keys(errors).length > 0 ? errors : null;
}

/** Creates (projectId = null) or updates a project with its tasks. */
export async function saveProject(
  projectId: string | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  if (projectId !== null && !projectIdSchema.safeParse(projectId).success) return fail(NOT_FOUND);

  const parsed = projectFormSchema.safeParse(readProjectForm(formData));
  if (!parsed.success) {
    return fail("Please fix the highlighted fields.", z.flattenError(parsed.error).fieldErrors);
  }

  const org = await managedOrg();
  if (!org) return fail(NOT_ALLOWED);
  const blocked = await writeBlocked(org.id);
  if (blocked) return fail(blocked);

  const supabase = await createClient();
  const referenceErrors = await checkReferences(supabase, org.id, parsed.data, projectId);
  if (referenceErrors) return fail("Please fix the highlighted fields.", referenceErrors);

  const p = parsed.data;
  const { data, error } = await supabase.rpc("save_project", {
    p_organization_id: org.id,
    p_project_id: projectId,
    p_project: {
      client_id: p.clientId,
      name: p.name,
      code: p.code,
      billing_method: p.billingMethod,
      hourly_rate_cents: p.hourlyRateCents,
      budget_minutes: p.budgetMinutes,
      budget_cents: p.budgetCents,
      notes: p.notes,
    },
    p_tasks: p.tasks.map((t) => ({
      task_id: t.taskId,
      is_billable: t.isBillable,
      hourly_rate_cents: t.hourlyRateCents,
    })),
  });
  if (error) {
    if (error.hint === "not_found") return fail(NOT_FOUND);
    // project_tasks rows referenced by time entries can't be deleted (FK).
    if (error.code === "23503") {
      return fail("Please fix the highlighted fields.", {
        tasks: ["A task you unticked already has time tracked on it. Keep it on this project."],
      });
    }
    return fail(GENERIC_ERROR);
  }

  revalidate();
  return ok({ id: data });
}

async function setArchived(id: string, archived: boolean): Promise<ActionResult> {
  const projectId = projectIdSchema.safeParse(id);
  if (!projectId.success) return fail(NOT_FOUND);

  const org = await managedOrg();
  if (!org) return fail(NOT_ALLOWED);
  const blocked = await writeBlocked(org.id);
  if (blocked) return fail(blocked);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq("id", projectId.data)
    .eq("organization_id", org.id)
    .select("id")
    .maybeSingle();
  if (error) return fail(GENERIC_ERROR);
  if (!data) return fail(NOT_FOUND);

  revalidate();
  return ok();
}

export async function archiveProject(id: string): Promise<ActionResult> {
  return setArchived(id, true);
}

export async function restoreProject(id: string): Promise<ActionResult> {
  return setArchived(id, false);
}

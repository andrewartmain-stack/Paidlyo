"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import { writeBlocked } from "@/features/billing/guard";
import { canManageOrg, getCurrentOrg } from "@/features/organizations/queries";
import { taskIdSchema, taskSchema, type TaskInput } from "./schemas";

const NOT_ALLOWED = "Only owners and admins can manage tasks.";
const NOT_FOUND = "This task no longer exists.";
const GENERIC_ERROR = "Something went wrong. Please try again.";

function invalid(error: z.ZodError) {
  return fail("Please fix the highlighted fields.", z.flattenError(error).fieldErrors);
}

function toRow(input: TaskInput) {
  return {
    name: input.name,
    default_hourly_rate_cents: input.defaultHourlyRateCents,
    is_billable: input.isBillable,
    is_common: input.isCommon,
  };
}

async function managedOrg() {
  const org = await getCurrentOrg();
  return canManageOrg(org) ? org : null;
}

function revalidate() {
  revalidatePath("/app/tasks");
  revalidatePath("/app/projects", "layout");
}

export async function addTask(formData: FormData): Promise<ActionResult> {
  const parsed = taskSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(parsed.error);

  const org = await managedOrg();
  if (!org) return fail(NOT_ALLOWED);
  const blocked = await writeBlocked(org.id);
  if (blocked) return fail(blocked);

  const supabase = await createClient();
  const { error } = await supabase
    .from("tasks")
    .insert({ organization_id: org.id, ...toRow(parsed.data) });
  if (error) return fail(GENERIC_ERROR);

  revalidate();
  return ok();
}

export async function updateTask(id: string, formData: FormData): Promise<ActionResult> {
  const taskId = taskIdSchema.safeParse(id);
  if (!taskId.success) return fail(NOT_FOUND);
  const parsed = taskSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(parsed.error);

  const org = await managedOrg();
  if (!org) return fail(NOT_ALLOWED);
  const blocked = await writeBlocked(org.id);
  if (blocked) return fail(blocked);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .update(toRow(parsed.data))
    .eq("id", taskId.data)
    .eq("organization_id", org.id)
    .select("id")
    .maybeSingle();
  if (error) return fail(GENERIC_ERROR);
  if (!data) return fail(NOT_FOUND);

  revalidate();
  return ok();
}

async function setArchived(id: string, archived: boolean): Promise<ActionResult> {
  const taskId = taskIdSchema.safeParse(id);
  if (!taskId.success) return fail(NOT_FOUND);

  const org = await managedOrg();
  if (!org) return fail(NOT_ALLOWED);
  const blocked = await writeBlocked(org.id);
  if (blocked) return fail(blocked);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq("id", taskId.data)
    .eq("organization_id", org.id)
    .select("id")
    .maybeSingle();
  if (error) return fail(GENERIC_ERROR);
  if (!data) return fail(NOT_FOUND);

  revalidate();
  return ok();
}

export async function archiveTask(id: string): Promise<ActionResult> {
  return setArchived(id, true);
}

export async function restoreTask(id: string): Promise<ActionResult> {
  return setArchived(id, false);
}

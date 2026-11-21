"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import { writeBlocked } from "@/features/billing/guard";
import { canManageOrg, getCurrentOrg } from "@/features/organizations/queries";
import { clientIdSchema, clientSchema } from "./schemas";

const NOT_ALLOWED = "Only owners and admins can manage clients.";
const NOT_FOUND = "This client no longer exists.";
const GENERIC_ERROR = "Something went wrong. Please try again.";
const CLIENTS_PATH = "/app/clients";

function invalid(error: z.ZodError) {
  return fail("Please fix the highlighted fields.", z.flattenError(error).fieldErrors);
}

async function managedOrg() {
  const org = await getCurrentOrg();
  return canManageOrg(org) ? org : null;
}

export async function addClient(formData: FormData): Promise<ActionResult> {
  const parsed = clientSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(parsed.error);

  const org = await managedOrg();
  if (!org) return fail(NOT_ALLOWED);
  const blocked = await writeBlocked(org.id);
  if (blocked) return fail(blocked);

  const supabase = await createClient();
  const { error } = await supabase
    .from("clients")
    .insert({ organization_id: org.id, ...parsed.data });
  if (error) return fail(GENERIC_ERROR);

  revalidatePath(CLIENTS_PATH);
  return ok();
}

export async function updateClient(id: string, formData: FormData): Promise<ActionResult> {
  const clientId = clientIdSchema.safeParse(id);
  if (!clientId.success) return fail(NOT_FOUND);
  const parsed = clientSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(parsed.error);

  const org = await managedOrg();
  if (!org) return fail(NOT_ALLOWED);
  const blocked = await writeBlocked(org.id);
  if (blocked) return fail(blocked);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clients")
    .update(parsed.data)
    .eq("id", clientId.data)
    .eq("organization_id", org.id)
    .select("id")
    .maybeSingle();
  if (error) return fail(GENERIC_ERROR);
  if (!data) return fail(NOT_FOUND);

  revalidatePath(CLIENTS_PATH);
  return ok();
}

async function setArchived(id: string, archived: boolean): Promise<ActionResult> {
  const clientId = clientIdSchema.safeParse(id);
  if (!clientId.success) return fail(NOT_FOUND);

  const org = await managedOrg();
  if (!org) return fail(NOT_ALLOWED);
  const blocked = await writeBlocked(org.id);
  if (blocked) return fail(blocked);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clients")
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq("id", clientId.data)
    .eq("organization_id", org.id)
    .select("id")
    .maybeSingle();
  if (error) return fail(GENERIC_ERROR);
  if (!data) return fail(NOT_FOUND);

  revalidatePath(CLIENTS_PATH);
  return ok();
}

export async function archiveClient(id: string): Promise<ActionResult> {
  return setArchived(id, true);
}

export async function restoreClient(id: string): Promise<ActionResult> {
  return setArchived(id, false);
}

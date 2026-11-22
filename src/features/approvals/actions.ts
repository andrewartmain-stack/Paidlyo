"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { writeBlocked } from "@/features/billing/guard";
import { canManageOrg, getCurrentOrg } from "@/features/organizations/queries";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import { createClient } from "@/lib/supabase/server";
import { reviewSchema, weekStartSchema } from "./schemas";

const GENERIC_ERROR = "Something went wrong. Please try again.";
const SUBMIT_ERRORS: Record<string, string> = {
  approvals_off: "Timesheet approval is turned off for your organization.",
  timer_running: "A timer is running this week. Stop it before submitting.",
  already_approved: "This week is already approved.",
  not_allowed: "You don't have permission to do that.",
};

function revalidate() {
  revalidatePath("/app/time");
  revalidatePath("/app/approvals");
  revalidatePath("/app");
}

/** Submit the signed-in user's week (Monday) for approval; its time is locked until reviewed. */
export async function submitWeek(week: string): Promise<ActionResult> {
  const parsed = weekStartSchema.safeParse(week);
  if (!parsed.success) return fail("Choose a week starting on Monday.");

  const org = await getCurrentOrg();
  const blocked = await writeBlocked(org.id);
  if (blocked) return fail(blocked);

  const supabase = await createClient();
  const { error } = await supabase.rpc("submit_week", { p_organization_id: org.id, p_week_start: parsed.data });
  if (error) return fail(SUBMIT_ERRORS[error.hint ?? ""] ?? GENERIC_ERROR);

  revalidate();
  return ok();
}

/** Take back a submitted (not yet approved) week so it can be edited again. */
export async function withdrawWeek(week: string): Promise<ActionResult> {
  const parsed = weekStartSchema.safeParse(week);
  if (!parsed.success) return fail("Choose a week starting on Monday.");

  const org = await getCurrentOrg();
  const supabase = await createClient();
  const { error } = await supabase.rpc("withdraw_week", { p_organization_id: org.id, p_week_start: parsed.data });
  if (error) return fail(error.hint === "not_found" ? "This week can't be withdrawn any more." : GENERIC_ERROR);

  revalidate();
  return ok();
}

/** Owners/admins: approve or reject a submitted week, or reopen an approved one. */
export async function reviewWeek(input: { id: string; action: string; note: string }): Promise<ActionResult> {
  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) return fail("Please fix the highlighted fields.", z.flattenError(parsed.error).fieldErrors);

  const org = await getCurrentOrg();
  if (!canManageOrg(org)) return fail("You don't have permission to do that.");

  const supabase = await createClient();
  const { error } = await supabase.rpc("review_week", {
    p_submission_id: parsed.data.id,
    p_action: parsed.data.action,
    p_note: parsed.data.note,
  });
  if (error) return fail(error.hint === "not_found" ? "This timesheet has changed. Refresh the page." : GENERIC_ERROR);

  revalidate();
  return ok();
}

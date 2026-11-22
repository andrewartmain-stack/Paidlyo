"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { writeBlocked } from "@/features/billing/guard";
import { syncSeats } from "@/features/billing/seats";
import { canManageOrg, getCurrentOrg } from "@/features/organizations/queries";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import { createClient } from "@/lib/supabase/server";
import { absoluteUrl } from "@/lib/site-url";
import { inviteUrlPath } from "./rules";
import {
  inviteIdSchema,
  inviteSchema,
  inviteTokenSchema,
  memberIdSchema,
  memberRateSchema,
  roleSchema,
} from "./schemas";

const TEAM_PATH = "/app/team";
const NOT_ALLOWED = "You don't have permission to do that.";
const GENERIC_ERROR = "Something went wrong. Please try again.";
const NOT_FOUND = "This person or invite no longer exists.";
const ALREADY_MEMBER = "This person already belongs to another Paidlyo organization.";

/** Creates an invite link to share with a colleague. */
export async function createInvite(formData: FormData): Promise<ActionResult<{ url: string }>> {
  const parsed = inviteSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail("Please fix the highlighted fields.", z.flattenError(parsed.error).fieldErrors);

  const org = await getCurrentOrg();
  if (!canManageOrg(org)) return fail(NOT_ALLOWED);
  const blocked = await writeBlocked(org.id);
  if (blocked) return fail(blocked);

  const supabase = await createClient();
  const { data: id, error } = await supabase.rpc("create_invite", {
    p_organization_id: org.id,
    p_role: parsed.data.role,
    p_email: parsed.data.email,
  });
  if (error) return fail(error.hint === "not_allowed" ? "Only the owner can invite admins." : GENERIC_ERROR);

  const { data: invite, error: readError } = await supabase
    .from("organization_invites")
    .select("token")
    .eq("id", id)
    .single();
  if (readError) return fail(GENERIC_ERROR);

  revalidatePath(TEAM_PATH);
  return ok({ url: absoluteUrl(inviteUrlPath(invite.token)) });
}

export async function revokeInvite(id: string): Promise<ActionResult> {
  const inviteId = inviteIdSchema.safeParse(id);
  if (!inviteId.success) return fail(NOT_FOUND);

  const supabase = await createClient();
  const { error } = await supabase.rpc("revoke_invite", { p_invite_id: inviteId.data });
  if (error) return fail(error.hint === "not_found" ? NOT_FOUND : GENERIC_ERROR);

  revalidatePath(TEAM_PATH);
  return ok();
}

export async function changeMemberRole(id: string, role: string): Promise<ActionResult> {
  const parsed = z.object({ id: memberIdSchema, role: roleSchema }).safeParse({ id, role });
  if (!parsed.success) return fail(NOT_FOUND);

  const supabase = await createClient();
  const { error } = await supabase.rpc("set_member_role", { p_member_id: parsed.data.id, p_role: parsed.data.role });
  if (error) return fail(error.hint === "not_found" ? NOT_ALLOWED : GENERIC_ERROR);

  revalidatePath(TEAM_PATH);
  return ok();
}

/** Deactivate (keeps their time, removes access) or reactivate a member. */
export async function setMemberActive(id: string, active: boolean): Promise<ActionResult> {
  const memberId = memberIdSchema.safeParse(id);
  if (!memberId.success) return fail(NOT_FOUND);

  const org = await getCurrentOrg();
  if (active) {
    const blocked = await writeBlocked(org.id);
    if (blocked) return fail(blocked);
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("set_member_active", { p_member_id: memberId.data, p_active: active });
  if (error) {
    if (error.hint === "already_member") return fail(ALREADY_MEMBER);
    return fail(error.hint === "not_found" ? NOT_ALLOWED : GENERIC_ERROR);
  }

  await syncSeats(org.id);
  revalidatePath(TEAM_PATH);
  revalidatePath("/app/reports");
  return ok();
}

/** Sets (or, when blank, removes) a member's billable rate. Applies to time logged from now on. */
export async function setMemberRate(formData: FormData): Promise<ActionResult> {
  const parsed = memberRateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail("Please fix the highlighted fields.", z.flattenError(parsed.error).fieldErrors);

  const org = await getCurrentOrg();
  if (!canManageOrg(org)) return fail(NOT_ALLOWED);
  const blocked = await writeBlocked(org.id);
  if (blocked) return fail(blocked);

  const supabase = await createClient();
  const { data: member, error: memberError } = await supabase
    .from("organization_members")
    .select("user_id")
    .eq("id", parsed.data.memberId)
    .eq("organization_id", org.id)
    .maybeSingle();
  if (memberError) return fail(GENERIC_ERROR);
  if (!member) return fail(NOT_FOUND);

  const rate = parsed.data.hourlyRate;
  const { error } =
    rate === null
      ? await supabase.from("member_rates").delete().eq("organization_id", org.id).eq("user_id", member.user_id)
      : await supabase.from("member_rates").upsert(
          {
            organization_id: org.id,
            user_id: member.user_id,
            hourly_rate_cents: rate,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "organization_id,user_id" },
        );
  if (error) return fail(GENERIC_ERROR);

  revalidatePath(TEAM_PATH);
  return ok();
}

const ACCEPT_ERRORS: Record<string, string> = {
  not_found: "This invite link doesn't work any more. Ask for a new one.",
  used: "This invite link has already been used. Ask for a new one.",
  expired: "This invite link has expired. Ask for a new one.",
  already_member: "You already belong to another Paidlyo organization, so you can't join this one with this account.",
};

/** Join page: joins the signed-in user to the invite's organization, then opens the app. */
export async function acceptInvite(formData: FormData): Promise<ActionResult> {
  const token = inviteTokenSchema.safeParse(formData.get("token"));
  if (!token.success) return fail(ACCEPT_ERRORS.not_found);

  const supabase = await createClient();
  const { data: orgId, error } = await supabase.rpc("accept_invite", { p_token: token.data });
  if (error) return fail(ACCEPT_ERRORS[error.hint ?? ""] ?? GENERIC_ERROR);

  // One more active person = one more seat (prorated by Stripe).
  await syncSeats(orgId);

  redirect("/app");
}

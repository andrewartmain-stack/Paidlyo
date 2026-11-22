import "server-only";
import { createClient } from "@/lib/supabase/server";
import { fetchAllRows } from "@/lib/supabase/fetch-all";
import type { CurrentOrg } from "@/features/organizations/types";
import { addDays, todayIn, weekStart } from "@/features/time/dates";
import { liveMinutes } from "@/features/time/duration";
import { INVITE_ROLES, inviteStatus, type InviteRole, type InviteStatus } from "./rules";
import type { InvitePreview, TeamInvite, TeamMember } from "./types";

const MAX_WEEK_ENTRIES = 20_000;

/** Billable rates by user id (RLS: owners/admins only; others get an empty map). */
async function loadRates(orgId: string): Promise<Map<string, number>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("member_rates")
    .select("user_id, hourly_rate_cents")
    .eq("organization_id", orgId);
  if (error) throw new Error("Could not load billable rates.");
  return new Map(data.map((row) => [row.user_id, row.hourly_rate_cents]));
}

/** Active members with no billable rate (warning on person-rate projects). */
export async function countMembersWithoutRate(orgId: string): Promise<number> {
  const supabase = await createClient();
  const [{ data, error }, rates] = await Promise.all([
    supabase.from("organization_members").select("user_id").eq("organization_id", orgId).is("archived_at", null),
    loadRates(orgId),
  ]);
  if (error) throw new Error("Could not load the team.");
  return data.filter((row) => !rates.has(row.user_id)).length;
}

/** Everyone in the organization (active first, then deactivated) with their hours this week. */
export async function listMembers(org: CurrentOrg, nowMs: number): Promise<TeamMember[]> {
  const supabase = await createClient();
  const { data: rows, error } = await supabase
    .from("organization_members")
    .select("id, user_id, role, archived_at, created_at")
    .eq("organization_id", org.id)
    .order("created_at");
  if (error) throw new Error("Could not load the team.");

  const userIds = rows.map((row) => row.user_id);
  const profiles = new Map<string, { name: string; email: string }>();
  if (userIds.length > 0) {
    const { data, error: profileError } = await supabase.from("profiles").select("id, full_name, email").in("id", userIds);
    if (profileError) throw new Error("Could not load the team.");
    for (const p of data) profiles.set(p.id, { name: p.full_name.trim(), email: p.email });
  }

  // Owners/admins can read every entry in the organization (RLS); members only their own.
  const start = weekStart(todayIn(org.timezone, new Date(nowMs)));
  const { rows: entries } = await fetchAllRows(
    (from, to) =>
      supabase
        .from("time_entries")
        .select("id, user_id, minutes, timer_started_at")
        .eq("organization_id", org.id)
        .gte("spent_date", start)
        .lte("spent_date", addDays(start, 6))
        .order("id")
        .range(from, to),
    MAX_WEEK_ENTRIES,
  );
  const rates = await loadRates(org.id);
  const minutes = new Map<string, number>();
  for (const entry of entries) {
    minutes.set(entry.user_id, (minutes.get(entry.user_id) ?? 0) + liveMinutes(entry.minutes, entry.timer_started_at, nowMs));
  }

  const members = rows.map((row): TeamMember => {
    const profile = profiles.get(row.user_id);
    return {
      id: row.id,
      userId: row.user_id,
      name: profile?.name || profile?.email || "Unknown",
      email: profile?.email ?? "",
      role: row.role,
      active: row.archived_at === null,
      joinedAt: row.created_at,
      minutesThisWeek: minutes.get(row.user_id) ?? 0,
      hourlyRateCents: rates.get(row.user_id) ?? null,
    };
  });
  return members.sort((a, b) => Number(b.active) - Number(a.active));
}

function asInviteRole(value: string): InviteRole {
  return (INVITE_ROLES as readonly string[]).includes(value) ? (value as InviteRole) : "member";
}

/** Invites still waiting to be accepted (valid or expired; used and revoked ones are hidden). */
export async function listOpenInvites(orgId: string, now: Date): Promise<TeamInvite[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organization_invites")
    .select("id, token, role, email, created_at, expires_at, accepted_at, revoked_at")
    .eq("organization_id", orgId)
    .is("accepted_at", null)
    .is("revoked_at", null)
    .order("created_at", { ascending: false });
  if (error) throw new Error("Could not load invites.");

  return data.map((row) => ({
    id: row.id,
    token: row.token,
    role: asInviteRole(row.role),
    email: row.email,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    status: inviteStatus({ expiresAt: row.expires_at, acceptedAt: row.accepted_at, revokedAt: row.revoked_at }, now),
  }));
}

const STATUSES: readonly InviteStatus[] = ["valid", "expired", "used", "revoked"];

/** What the join page shows; works signed out (RPC get_invite_preview). Null for unknown links. */
export async function getInvitePreview(token: string): Promise<InvitePreview | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_invite_preview", { p_token: token });
  if (error || !data || typeof data !== "object" || Array.isArray(data)) return null;

  const preview = data as Record<string, unknown>;
  const status = STATUSES.includes(preview.status as InviteStatus) ? (preview.status as InviteStatus) : "revoked";
  const role = preview.role === "admin" || preview.role === "owner" ? preview.role : "member";
  return {
    organizationName: String(preview.organization_name ?? ""),
    role,
    inviterName: String(preview.inviter_name ?? "A teammate"),
    status,
  };
}

/*
 * Who can manage whom (pure). Mirrors the checks in the team_members migration
 * (create_invite, set_member_role, set_member_active) so the UI only offers allowed actions.
 */
import type { OrgRole } from "@/features/organizations/types";

export const INVITE_ROLES = ["member", "admin"] as const;
export type InviteRole = (typeof INVITE_ROLES)[number];

export const ROLE_LABELS: Record<OrgRole, string> = { owner: "Owner", admin: "Admin", member: "Member" };

export const ROLE_DESCRIPTIONS: Record<InviteRole, string> = {
  member: "Tracks their own time. No access to money, invoices or reports.",
  admin: "Manages clients, projects, invoices, reports and members. No billing.",
};

export type MemberRef = { userId: string; role: OrgRole; active: boolean };
export type Actor = { userId: string; role: OrgRole };

/** Owners invite admins or members; admins invite members only. */
export function canInvite(actor: Actor, role: InviteRole): boolean {
  if (actor.role === "owner") return true;
  return actor.role === "admin" && role === "member";
}

/** Roles the actor may pick in the invite form. */
export function invitableRoles(actor: Actor): InviteRole[] {
  return INVITE_ROLES.filter((role) => canInvite(actor, role));
}

/** Only the owner changes roles, never their own or the owner's. */
export function canChangeRole(actor: Actor, member: MemberRef): boolean {
  return actor.role === "owner" && member.role !== "owner" && member.userId !== actor.userId && member.active;
}

/** Owners manage everyone but themselves; admins manage members. The owner is never deactivated. */
export function canSetActive(actor: Actor, member: MemberRef): boolean {
  if (member.role === "owner" || member.userId === actor.userId) return false;
  if (actor.role === "owner") return true;
  return actor.role === "admin" && member.role === "member";
}

export type InviteStatus = "valid" | "expired" | "used" | "revoked";

export function inviteStatus(
  invite: { expiresAt: string; acceptedAt: string | null; revokedAt: string | null },
  now: Date,
): InviteStatus {
  if (invite.revokedAt) return "revoked";
  if (invite.acceptedAt) return "used";
  return new Date(invite.expiresAt).getTime() <= now.getTime() ? "expired" : "valid";
}

export function inviteUrlPath(token: string): string {
  return `/join/${token}`;
}

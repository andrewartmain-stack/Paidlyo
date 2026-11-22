import type { OrgRole } from "@/features/organizations/types";
import type { InviteRole, InviteStatus } from "./rules";

export type TeamMember = {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: OrgRole;
  active: boolean;
  joinedAt: string;
  minutesThisWeek: number;
  /** Billable rate (cents/hour); null when not set. Only owners/admins can read rates. */
  hourlyRateCents: number | null;
};

export type TeamInvite = {
  id: string;
  token: string;
  role: InviteRole;
  email: string | null;
  createdAt: string;
  expiresAt: string;
  status: InviteStatus;
};

export type InvitePreview = {
  organizationName: string;
  role: OrgRole;
  inviterName: string;
  status: InviteStatus;
};

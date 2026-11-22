import { describe, expect, it } from "vitest";
import { safeNext } from "@/features/auth/redirect";
import {
  canChangeRole,
  canInvite,
  canSetActive,
  invitableRoles,
  inviteStatus,
  inviteUrlPath,
  type Actor,
  type MemberRef,
} from "@/features/team/rules";
import { inviteSchema, memberRateSchema } from "@/features/team/schemas";

const owner: Actor = { userId: "u-owner", role: "owner" };
const admin: Actor = { userId: "u-admin", role: "admin" };
const member: Actor = { userId: "u-member", role: "member" };

const ref = (userId: string, role: MemberRef["role"], active = true): MemberRef => ({ userId, role, active });

describe("inviting", () => {
  it("lets owners invite admins and members, admins members only, members nobody", () => {
    expect(invitableRoles(owner)).toEqual(["member", "admin"]);
    expect(invitableRoles(admin)).toEqual(["member"]);
    expect(invitableRoles(member)).toEqual([]);
    expect(canInvite(admin, "admin")).toBe(false);
  });

  it("validates the invite form (email optional)", () => {
    expect(inviteSchema.safeParse({ role: "member", email: "" }).success).toBe(true);
    expect(inviteSchema.parse({ role: "admin", email: "  Ana@Studio.COM " }).email).toBe("ana@studio.com");
    expect(inviteSchema.safeParse({ role: "member", email: "not-an-email" }).success).toBe(false);
    expect(inviteSchema.safeParse({ role: "owner", email: "" }).success).toBe(false);
  });
});

describe("changing roles", () => {
  it("is for the owner only, never on the owner or themselves, and only for active people", () => {
    expect(canChangeRole(owner, ref("a", "member"))).toBe(true);
    expect(canChangeRole(owner, ref("a", "admin"))).toBe(true);
    expect(canChangeRole(owner, ref("u-owner", "owner"))).toBe(false);
    expect(canChangeRole(owner, ref("a", "member", false))).toBe(false);
    expect(canChangeRole(admin, ref("a", "member"))).toBe(false);
  });
});

describe("deactivating", () => {
  it("lets owners manage everyone but themselves and admins manage members", () => {
    expect(canSetActive(owner, ref("a", "admin"))).toBe(true);
    expect(canSetActive(owner, ref("a", "member"))).toBe(true);
    expect(canSetActive(admin, ref("a", "member"))).toBe(true);
    expect(canSetActive(admin, ref("b", "admin"))).toBe(false);
    expect(canSetActive(admin, ref("u-admin", "admin"))).toBe(false);
    expect(canSetActive(member, ref("a", "member"))).toBe(false);
  });

  it("never deactivates the owner", () => {
    expect(canSetActive(owner, ref("u-owner", "owner"))).toBe(false);
    expect(canSetActive(admin, ref("u-owner", "owner"))).toBe(false);
  });
});

describe("invite status", () => {
  const now = new Date("2026-11-22T12:00:00Z");
  const base = { expiresAt: "2026-12-06T12:00:00Z", acceptedAt: null, revokedAt: null };

  it("is valid until it expires, then expired; used and revoked win", () => {
    expect(inviteStatus(base, now)).toBe("valid");
    expect(inviteStatus({ ...base, expiresAt: now.toISOString() }, now)).toBe("expired");
    expect(inviteStatus({ ...base, acceptedAt: "2026-11-23T00:00:00Z" }, now)).toBe("used");
    expect(inviteStatus({ ...base, acceptedAt: "x", revokedAt: "y" }, now)).toBe("revoked");
  });

  it("builds join links that survive sign-up's next= redirect", () => {
    const path = inviteUrlPath("6f1c2b9e-3d4a-4b5c-8d7e-9f0a1b2c3d4e");
    expect(path).toBe("/join/6f1c2b9e-3d4a-4b5c-8d7e-9f0a1b2c3d4e");
    expect(safeNext(path)).toBe(path);
  });
});

describe("memberRateSchema", () => {
  const memberId = "6f1c1d1e-2b3a-4c5d-8e9f-0a1b2c3d4e5f";
  it("turns the rate into cents and treats empty as removing it", () => {
    expect(memberRateSchema.parse({ memberId, hourlyRate: "125.50" }).hourlyRate).toBe(12550);
    expect(memberRateSchema.parse({ memberId, hourlyRate: " " }).hourlyRate).toBeNull();
  });
  it("rejects negative or malformed rates and bad ids", () => {
    expect(memberRateSchema.safeParse({ memberId, hourlyRate: "-5" }).success).toBe(false);
    expect(memberRateSchema.safeParse({ memberId, hourlyRate: "abc" }).success).toBe(false);
    expect(memberRateSchema.safeParse({ memberId: "x", hourlyRate: "10" }).success).toBe(false);
  });
});

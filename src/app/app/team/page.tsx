import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { UsersRound } from "lucide-react";
import { PageIcon } from "@/components/page-icon";
import { getCurrentUser } from "@/features/auth/queries";
import { isLiveStatus } from "@/features/billing/access";
import { getOrgBilling, listPlanPrices } from "@/features/billing/queries";
import { canManageOrg, getCurrentOrg } from "@/features/organizations/queries";
import { InviteButton } from "@/features/team/components/invite-button";
import { InvitesList } from "@/features/team/components/invites-list";
import { MembersTable } from "@/features/team/components/members-table";
import { listMembers, listOpenInvites } from "@/features/team/queries";
import { invitableRoles } from "@/features/team/rules";
import { formatMoney } from "@/lib/money";
import { siteUrl } from "@/lib/site-url";

export const metadata: Metadata = { title: "Team" };

export default function TeamPage() {
  return (
    <Suspense fallback={<TeamSkeleton />}>
      <Team />
    </Suspense>
  );
}

function TeamSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading team" className="flex flex-col gap-6">
      <div className="h-14 w-64 rounded-lg bg-muted" />
      <div className="h-72 rounded-xl bg-muted" />
    </div>
  );
}

async function Team() {
  const [org, user] = await Promise.all([getCurrentOrg(), getCurrentUser()]);
  if (!canManageOrg(org)) redirect("/app/time");

  const now = new Date();
  const [members, invites, billing, prices] = await Promise.all([
    listMembers(org, now.getTime()),
    listOpenInvites(org.id, now),
    getOrgBilling(org.id),
    listPlanPrices(),
  ]);
  const seatPrice = billing && isLiveStatus(billing.status) ? prices?.find((p) => p.interval === billing.interval) : undefined;
  const actor = { userId: user.id, role: org.role };
  const active = members.filter((member) => member.active).length;

  const date = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: org.timezone });
  const joinedLabels = Object.fromEntries(members.map((m) => [m.id, date.format(new Date(m.joinedAt))]));
  const expiresLabels = Object.fromEntries(invites.map((i) => [i.id, date.format(new Date(i.expiresAt))]));

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-4">
          <PageIcon icon={UsersRound} />
          <div>
            <h1 className="text-3xl">Team</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {active} active {active === 1 ? "person" : "people"}. Invite teammates to track time in {org.name}.
            </p>
            {seatPrice && (
              <p className="mt-1 text-xs text-muted-foreground">
                Each active person adds {formatMoney(seatPrice.amountCents, seatPrice.currency)}/{seatPrice.interval} to
                your plan, prorated. Deactivated people and pending invites are free.
              </p>
            )}
          </div>
        </div>
        <InviteButton roles={invitableRoles(actor)} />
      </div>

      <section aria-labelledby="members-title" className="flex flex-col gap-3">
        <h2 id="members-title" className="text-lg">
          Members
        </h2>
        <MembersTable members={members} actor={actor} joinedLabels={joinedLabels} currency={org.currency} />
      </section>

      {invites.length > 0 && (
        <section aria-labelledby="invites-title" className="flex flex-col gap-3">
          <h2 id="invites-title" className="text-lg">
            Pending invites
          </h2>
          <InvitesList invites={invites} origin={siteUrl()} expiresLabels={expiresLabels} />
        </section>
      )}
    </div>
  );
}

import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { BillingOverview } from "@/features/billing/components/billing-overview";
import { getOrgBilling, listPlanPrices } from "@/features/billing/queries";
import { getSeatStatus } from "@/features/billing/seats";
import { canManageOrg, getCurrentOrg } from "@/features/organizations/queries";

export const metadata: Metadata = { title: "Billing" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default function BillingPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Link
          href="/app/settings"
          className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Settings
        </Link>
        <h1 className="text-3xl">Billing</h1>
        <p className="text-sm text-muted-foreground">One plan with everything included, priced per person. Cancel any time.</p>
      </div>
      <Suspense fallback={<div className="h-72 rounded-xl bg-muted" />}>
        <Billing searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Billing({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const org = await getCurrentOrg();
  if (!canManageOrg(org)) redirect("/app/settings");

  const [billing, prices, seats] = await Promise.all([
    getOrgBilling(org.id),
    listPlanPrices(),
    getSeatStatus(org.id),
  ]);
  if (!billing) {
    return (
      <p className="rounded-lg bg-muted px-4 py-3 text-sm">
        Billing isn&apos;t set up for this account yet. Please contact support.
      </p>
    );
  }

  return (
    <BillingOverview
      billing={billing}
      prices={prices}
      timeZone={org.timezone}
      seats={seats}
      checkoutSuccess={params.checkout === "success"}
      seatsSynced={params.seats === "synced"}
      error={typeof params.error === "string" ? params.error : undefined}
    />
  );
}

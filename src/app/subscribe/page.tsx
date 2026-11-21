import { Suspense } from "react";
import { redirect } from "next/navigation";
import { SuccessIllustration, TrialIllustration } from "@/components/illustrations";
import { Button } from "@/components/ui/button";
import { signOut } from "@/features/auth/actions";
import { AuthCard } from "@/features/auth/components/auth-card";
import { billingAccess, mustSubscribe, TRIAL_DAYS, trialEligible } from "@/features/billing/access";
import { BILLING_ERRORS } from "@/features/billing/components/billing-overview";
import { PlanPicker } from "@/features/billing/components/plan-picker";
import { RefreshUntilReady } from "@/features/billing/components/refresh-until-ready";
import { getOrgBilling, listPlanPrices } from "@/features/billing/queries";
import { canManageOrg, findCurrentOrg } from "@/features/organizations/queries";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/** First step after onboarding: the trial starts once a card is added in Stripe Checkout. */
export default function SubscribePage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <AuthCard
      title={`Start your ${TRIAL_DAYS}-day free trial`}
      description={`Add a card to start. You won't be charged until your trial ends, and you can cancel any time before that in Settings → Billing.`}
      footer={
        <form action={signOut}>
          <Button type="submit" variant="link" className="h-auto p-0 text-muted-foreground">
            Log out
          </Button>
        </form>
      }
    >
      <Suspense fallback={<div className="h-48 rounded-xl bg-muted" />}>
        <Subscribe searchParams={searchParams} />
      </Suspense>
    </AuthCard>
  );
}

async function Subscribe({ searchParams }: { searchParams: SearchParams }) {
  const [params, org] = await Promise.all([searchParams, findCurrentOrg()]);
  if (!org) redirect("/onboarding");

  const billing = await getOrgBilling(org.id);
  if (!billing || !mustSubscribe(billingAccess(billing, new Date()))) redirect("/app");

  if (params.checkout === "success") {
    return (
      <div role="status" className="flex flex-col items-center gap-3 text-center">
        <RefreshUntilReady />
        <SuccessIllustration className="h-36 w-auto" />
        <p className="text-sm">Thanks! We&apos;re confirming your trial with Stripe. This takes a few seconds.</p>
      </div>
    );
  }

  if (!canManageOrg(org)) {
    return (
      <p className="text-sm text-muted-foreground">
        {org.name} doesn&apos;t have an active plan yet. Ask the account owner to start the free trial.
      </p>
    );
  }

  const error = typeof params.error === "string" ? BILLING_ERRORS[params.error] : undefined;
  const prices = await listPlanPrices();
  return (
    <div className="flex flex-col gap-4">
      <TrialIllustration className="mx-auto h-36 w-auto" />
      {error && (
        <p role="alert" className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}
      <PlanPicker prices={prices} from="subscribe" trial={trialEligible(billing)} />
    </div>
  );
}

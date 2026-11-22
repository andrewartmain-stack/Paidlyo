"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getCurrentUser } from "@/features/auth/queries";
import { canManageOrg, getCurrentOrg } from "@/features/organizations/queries";
import { getStripe } from "@/lib/stripe";
import { absoluteUrl } from "@/lib/site-url";
import { isLiveStatus, PLAN_INTERVALS, TRIAL_DAYS, trialEligible } from "./access";
import { getOrgBilling, priceIds } from "./queries";
import { seatsToBill } from "./seat-count";
import { countActiveMembers, syncSeats } from "./seats";

/** Pages that start a checkout; the user comes back to the same page. */
const RETURN_PATHS = { subscribe: "/subscribe", billing: "/app/settings/billing" } as const;

const checkoutSchema = z.object({
  interval: z.enum(PLAN_INTERVALS),
  from: z.enum(["subscribe", "billing"]).catch("billing"),
});

/**
 * Send the owner to Stripe Checkout. A first subscription gets the free trial: the card is
 * collected now and charged automatically when the trial ends.
 */
export async function startCheckout(formData: FormData): Promise<void> {
  const parsed = checkoutSchema.safeParse({ interval: formData.get("interval"), from: formData.get("from") });
  const back = parsed.success ? RETURN_PATHS[parsed.data.from] : RETURN_PATHS.billing;
  const org = await getCurrentOrg();
  if (!parsed.success || !canManageOrg(org)) redirect(back);

  const [user, billing, activeMembers] = await Promise.all([
    getCurrentUser(),
    getOrgBilling(org.id),
    countActiveMembers(org.id),
  ]);
  const ids = priceIds();
  if (!billing || !ids) redirect(`${back}?error=unavailable`);

  // Already subscribed: plan changes and cancellation happen in the portal.
  if (isLiveStatus(billing.status)) redirect("/app/settings/billing");

  let url: string | null;
  try {
    const session = await getStripe().checkout.sessions.create({
      mode: "subscription",
      payment_method_collection: "always",
      // $9 per active person: one seat per active member.
      line_items: [{ price: ids[parsed.data.interval], quantity: seatsToBill(activeMembers) }],
      ...(billing.stripeCustomerId ? { customer: billing.stripeCustomerId } : { customer_email: user.email }),
      client_reference_id: org.id,
      metadata: { organization_id: org.id },
      subscription_data: {
        metadata: { organization_id: org.id },
        ...(trialEligible(billing) ? { trial_period_days: TRIAL_DAYS } : {}),
      },
      allow_promotion_codes: true,
      success_url: absoluteUrl(`${back}?checkout=success`),
      cancel_url: absoluteUrl(back),
    });
    url = session.url;
  } catch (error) {
    console.error("Stripe checkout failed", error);
    url = null;
  }
  redirect(url ?? `${back}?error=checkout`);
}

/** Send the owner to the Stripe Customer Portal (change plan, card, cancel, invoices). */
export async function openBillingPortal(): Promise<void> {
  const org = await getCurrentOrg();
  if (!canManageOrg(org)) redirect("/app/settings/billing");

  const billing = await getOrgBilling(org.id);
  if (!billing?.stripeCustomerId) redirect("/app/settings/billing");

  let url: string | null;
  try {
    const session = await getStripe().billingPortal.sessions.create({
      customer: billing.stripeCustomerId,
      return_url: absoluteUrl("/app/settings/billing"),
    });
    url = session.url;
  } catch (error) {
    console.error("Stripe portal failed", error);
    url = null;
  }
  redirect(url ?? "/app/settings/billing?error=portal");
}

/** Billing page "Sync seats": sets Stripe's quantity to the number of active people. */
export async function syncSeatsNow(): Promise<void> {
  const org = await getCurrentOrg();
  if (!canManageOrg(org)) redirect("/app/settings/billing");
  const synced = await syncSeats(org.id);
  redirect(synced ? "/app/settings/billing?seats=synced" : "/app/settings/billing?error=seats");
}

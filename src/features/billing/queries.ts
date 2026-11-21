import "server-only";
import { cache } from "react";
import { getStripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { PLAN_INTERVALS, SUBSCRIPTION_STATUSES, type BillingState, type PlanInterval, type SubscriptionStatus } from "./access";

function asStatus(value: string | null): SubscriptionStatus | null {
  return value && (SUBSCRIPTION_STATUSES as readonly string[]).includes(value) ? (value as SubscriptionStatus) : null;
}

function asInterval(value: string | null): PlanInterval | null {
  return value && (PLAN_INTERVALS as readonly string[]).includes(value) ? (value as PlanInterval) : null;
}

export type OrgBilling = BillingState & { stripeCustomerId: string | null };

/** The organization's billing row (RLS: members can read). Null if it's missing. */
export const getOrgBilling = cache(async (organizationId: string): Promise<OrgBilling | null> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("organization_billing")
    .select(
      "stripe_customer_id, stripe_subscription_id, subscription_status, plan_interval, current_period_end, cancel_at_period_end",
    )
    .eq("organization_id", organizationId)
    .maybeSingle();
  if (!data) return null;

  return {
    status: asStatus(data.subscription_status),
    interval: asInterval(data.plan_interval),
    currentPeriodEnd: data.current_period_end,
    cancelAtPeriodEnd: data.cancel_at_period_end,
    hasSubscription: data.stripe_subscription_id !== null,
    stripeCustomerId: data.stripe_customer_id,
  };
});

/** Stripe price ids for each interval, from env (null when billing isn't configured). */
export function priceIds(): Record<PlanInterval, string> | null {
  const month = process.env.STRIPE_PRICE_MONTHLY;
  const year = process.env.STRIPE_PRICE_YEARLY;
  if (!month || !year || !process.env.STRIPE_SECRET_KEY) return null;
  return { month, year };
}

export type PlanPrice = { interval: PlanInterval; amountCents: number; currency: string };

/** The plan prices as set in Stripe (the source of truth for amounts). */
export async function listPlanPrices(): Promise<PlanPrice[] | null> {
  const ids = priceIds();
  if (!ids) return null;
  try {
    const stripe = getStripe();
    const prices = await Promise.all(PLAN_INTERVALS.map((interval) => stripe.prices.retrieve(ids[interval])));
    return prices.map((price, i) => ({
      interval: PLAN_INTERVALS[i],
      amountCents: price.unit_amount ?? 0,
      currency: price.currency.toUpperCase(),
    }));
  } catch (error) {
    console.error("Failed to load Stripe prices", error);
    return null;
  }
}

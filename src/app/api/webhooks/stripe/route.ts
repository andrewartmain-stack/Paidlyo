import type Stripe from "stripe";
import {
  eventSubscriptionId,
  shouldApply,
  subscriptionOrgId,
  subscriptionToRow,
  SUBSCRIPTION_EVENTS,
} from "@/features/billing/stripe-sync";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SubscriptionStatus } from "@/features/billing/access";

/**
 * Stripe webhook: keeps organization_billing in sync with Stripe.
 * Always re-reads the subscription from Stripe, so duplicate or out-of-order events are harmless.
 */
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  const signature = request.headers.get("stripe-signature");
  if (!secret) {
    console.error("Stripe webhook: STRIPE_WEBHOOK_SECRET is not set");
    return new Response("Webhook not configured", { status: 500 });
  }
  if (!signature) return new Response("Missing signature", { status: 400 });

  const stripe = getStripe();
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(await request.text(), signature, secret);
  } catch {
    // Usually STRIPE_WEBHOOK_SECRET belongs to another endpoint or mode (sandbox vs live).
    console.error("Stripe webhook: invalid signature (check STRIPE_WEBHOOK_SECRET)");
    return new Response("Invalid signature", { status: 400 });
  }

  if (!SUBSCRIPTION_EVENTS.has(event.type)) return Response.json({ received: true });

  const subscriptionId = eventSubscriptionId(event);
  if (!subscriptionId) return Response.json({ received: true });

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const organizationId = subscriptionOrgId(subscription);
  if (!organizationId) return Response.json({ received: true, ignored: "no organization" });

  const admin = createAdminClient();
  const { data: current, error: readError } = await admin
    .from("organization_billing")
    .select("stripe_subscription_id, subscription_status")
    .eq("organization_id", organizationId)
    .maybeSingle();
  if (readError) {
    console.error("Stripe webhook: billing read failed:", readError.message);
    return new Response("Database error", { status: 500 });
  }
  if (!current) {
    console.error("Stripe webhook: no billing row for organization", organizationId);
    return Response.json({ received: true, ignored: "unknown organization" });
  }

  const row = subscriptionToRow(subscription);
  const stored = {
    stripe_subscription_id: current.stripe_subscription_id,
    subscription_status: current.subscription_status as SubscriptionStatus | null,
  };
  if (!shouldApply(stored, row)) return Response.json({ received: true, ignored: "stale subscription" });

  const { error } = await admin.from("organization_billing").update(row).eq("organization_id", organizationId);
  // 500 makes Stripe retry later.
  if (error) {
    console.error("Stripe webhook: billing update failed:", error.message);
    return new Response("Database error", { status: 500 });
  }

  return Response.json({ received: true });
}

import type Stripe from "stripe";
import { isLiveStatus, PLAN_INTERVALS, SUBSCRIPTION_STATUSES, type PlanInterval, type SubscriptionStatus } from "./access";

/** The organization_billing columns mirrored from a Stripe subscription. */
export type SubscriptionRow = {
  stripe_customer_id: string;
  stripe_subscription_id: string;
  subscription_status: SubscriptionStatus;
  plan_interval: PlanInterval | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
};

function asStatus(value: string): SubscriptionStatus {
  return (SUBSCRIPTION_STATUSES as readonly string[]).includes(value)
    ? (value as SubscriptionStatus)
    : "incomplete";
}

function asInterval(value: string | undefined): PlanInterval | null {
  return value && (PLAN_INTERVALS as readonly string[]).includes(value) ? (value as PlanInterval) : null;
}

/** Map a Stripe subscription to its row. The period end lives on the item in current API versions. */
export function subscriptionToRow(sub: Stripe.Subscription): SubscriptionRow {
  const item = sub.items.data[0];
  return {
    stripe_customer_id: typeof sub.customer === "string" ? sub.customer : sub.customer.id,
    stripe_subscription_id: sub.id,
    subscription_status: asStatus(sub.status),
    plan_interval: asInterval(item?.price.recurring?.interval),
    current_period_end: item ? new Date(item.current_period_end * 1000).toISOString() : null,
    cancel_at_period_end: sub.cancel_at_period_end || sub.cancel_at !== null,
  };
}

/** The organization a subscription belongs to (set as metadata when checkout starts). */
export function subscriptionOrgId(sub: Stripe.Subscription): string | null {
  const id = sub.metadata?.organization_id;
  return typeof id === "string" && /^[0-9a-f-]{36}$/i.test(id) ? id : null;
}

/**
 * Whether an incoming subscription state should overwrite the stored one. An ended old
 * subscription (e.g. a late "deleted" event after the customer re-subscribed) must not replace
 * a different, live subscription.
 */
export function shouldApply(
  current: { stripe_subscription_id: string | null; subscription_status: SubscriptionStatus | null },
  incoming: SubscriptionRow,
): boolean {
  if (!current.stripe_subscription_id || current.stripe_subscription_id === incoming.stripe_subscription_id) {
    return true;
  }
  return !isLiveStatus(current.subscription_status) || isLiveStatus(incoming.subscription_status);
}

/** Webhook events that change a subscription. */
export const SUBSCRIPTION_EVENTS = new Set<string>([
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "customer.subscription.paused",
  "customer.subscription.resumed",
]);

/** The subscription id an event refers to, if any. */
export function eventSubscriptionId(event: Stripe.Event): string | null {
  const object = event.data.object as { object?: string; id?: string; subscription?: unknown };
  if (object.object === "subscription" && typeof object.id === "string") return object.id;
  if (object.object === "checkout.session") {
    const sub = object.subscription;
    if (typeof sub === "string") return sub;
    if (sub && typeof sub === "object" && "id" in sub && typeof sub.id === "string") return sub.id;
  }
  return null;
}

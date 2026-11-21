/*
 * Who may use the app (pure, shared by server code and tests).
 *
 * Every organization needs a Stripe subscription. New ones start it with a 14-day trial that
 * requires a card and is charged automatically when the trial ends. Organizations that never
 * subscribed are sent to /subscribe; ones whose subscription ended become read-only.
 * `past_due` stays usable: Stripe keeps retrying the card and ends the subscription itself if
 * every retry fails.
 */

export const SUBSCRIPTION_STATUSES = [
  "incomplete",
  "incomplete_expired",
  "trialing",
  "active",
  "past_due",
  "canceled",
  "unpaid",
  "paused",
] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

export const PLAN_INTERVALS = ["month", "year"] as const;
export type PlanInterval = (typeof PLAN_INTERVALS)[number];

/** Length of the card-required Stripe trial for an organization's first subscription. */
export const TRIAL_DAYS = 14;

/** Days before the trial ends when the app starts showing a reminder. */
export const TRIAL_REMINDER_DAYS = 3;

const DAY_MS = 24 * 60 * 60 * 1000;

export type BillingState = {
  status: SubscriptionStatus | null;
  interval: PlanInterval | null;
  /** During a trial this is the trial end (the first charge). */
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  hasSubscription: boolean;
};

export type BillingAccess =
  | { kind: "none" }
  | { kind: "trialing"; daysLeft: number }
  | { kind: "active" }
  | { kind: "past_due" }
  | { kind: "expired" };

const LIVE_STATUSES: readonly SubscriptionStatus[] = ["trialing", "active", "past_due"];

export function isLiveStatus(status: SubscriptionStatus | null): boolean {
  return status !== null && LIVE_STATUSES.includes(status);
}

export function billingAccess(billing: BillingState, now: Date): BillingAccess {
  switch (billing.status) {
    case "trialing": {
      const end = billing.currentPeriodEnd ? new Date(billing.currentPeriodEnd).getTime() : now.getTime();
      return { kind: "trialing", daysLeft: Math.max(0, Math.ceil((end - now.getTime()) / DAY_MS)) };
    }
    case "active":
      return { kind: "active" };
    case "past_due":
      return { kind: "past_due" };
    case "canceled":
    case "unpaid":
    case "paused":
      return { kind: "expired" };
    default:
      // null, or a checkout whose first payment never completed: no working subscription yet.
      return { kind: "none" };
  }
}

/** Whether the organization can add or change data. */
export function canWrite(access: BillingAccess): boolean {
  return access.kind === "trialing" || access.kind === "active" || access.kind === "past_due";
}

/** Organizations that never had a working subscription must start one before using the app. */
export function mustSubscribe(access: BillingAccess): boolean {
  return access.kind === "none";
}

/** First subscriptions get the free trial; returning customers subscribe without one. */
export function trialEligible(billing: Pick<BillingState, "status" | "hasSubscription">): boolean {
  return !billing.hasSubscription || billing.status === null;
}

/** Whether to show the billing banner across the app. */
export function needsAttention(access: BillingAccess): boolean {
  if (access.kind === "trialing") return access.daysLeft <= TRIAL_REMINDER_DAYS;
  return access.kind === "past_due" || access.kind === "expired";
}

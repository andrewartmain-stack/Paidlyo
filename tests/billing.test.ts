import Stripe from "stripe";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  billingAccess,
  canWrite,
  mustSubscribe,
  needsAttention,
  trialEligible,
  type BillingState,
} from "@/features/billing/access";
import { readOnlyMessage } from "@/features/billing/guard";
import {
  eventSubscriptionId,
  shouldApply,
  subscriptionOrgId,
  subscriptionToRow,
  type SubscriptionRow,
} from "@/features/billing/stripe-sync";

vi.mock("server-only", () => ({}));

const NOW = new Date("2026-11-21T12:00:00Z");
const ORG_ID = "6f1c2b9e-3d4a-4b5c-8d7e-9f0a1b2c3d4e";

function state(overrides: Partial<BillingState> = {}): BillingState {
  return {
    status: null,
    interval: null,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
    hasSubscription: false,
    ...overrides,
  };
}

describe("billingAccess", () => {
  it("sends organizations without a subscription to start the trial", () => {
    const access = billingAccess(state(), NOW);
    expect(access).toEqual({ kind: "none" });
    expect(mustSubscribe(access)).toBe(true);
    expect(canWrite(access)).toBe(false);
  });

  it("treats a checkout that never completed like no subscription", () => {
    expect(billingAccess(state({ status: "incomplete", hasSubscription: true }), NOW)).toEqual({ kind: "none" });
    expect(billingAccess(state({ status: "incomplete_expired", hasSubscription: true }), NOW)).toEqual({ kind: "none" });
  });

  it("counts Stripe trial days left until the first charge, rounding up", () => {
    const trial = state({ status: "trialing", hasSubscription: true, currentPeriodEnd: "2026-12-05T12:00:00Z" });
    expect(billingAccess(trial, NOW)).toEqual({ kind: "trialing", daysLeft: 14 });
    const lastHour = { ...trial, currentPeriodEnd: "2026-11-21T13:00:00Z" };
    expect(billingAccess(lastHour, NOW)).toEqual({ kind: "trialing", daysLeft: 1 });
  });

  it("lets trialing, active and past-due subscriptions change data", () => {
    for (const status of ["trialing", "active", "past_due"] as const) {
      const access = billingAccess(state({ status, hasSubscription: true }), NOW);
      expect(canWrite(access)).toBe(true);
      expect(mustSubscribe(access)).toBe(false);
    }
  });

  it("makes ended subscriptions read-only instead of sending them to the trial page", () => {
    for (const status of ["canceled", "unpaid", "paused"] as const) {
      const access = billingAccess(state({ status, hasSubscription: true }), NOW);
      expect(access).toEqual({ kind: "expired" });
      expect(canWrite(access)).toBe(false);
      expect(mustSubscribe(access)).toBe(false);
    }
  });
});

describe("trialEligible", () => {
  it("gives the free trial to first subscriptions only", () => {
    expect(trialEligible({ status: null, hasSubscription: false })).toBe(true);
    expect(trialEligible({ status: "canceled", hasSubscription: true })).toBe(false);
    expect(trialEligible({ status: "incomplete_expired", hasSubscription: true })).toBe(false);
  });
});

describe("needsAttention", () => {
  it("reminds in the last 3 trial days and on billing problems only", () => {
    expect(needsAttention({ kind: "trialing", daysLeft: 4 })).toBe(false);
    expect(needsAttention({ kind: "trialing", daysLeft: 3 })).toBe(true);
    expect(needsAttention({ kind: "active" })).toBe(false);
    expect(needsAttention({ kind: "none" })).toBe(false);
    expect(needsAttention({ kind: "past_due" })).toBe(true);
    expect(needsAttention({ kind: "expired" })).toBe(true);
  });
});

describe("readOnlyMessage", () => {
  it("blocks only accounts without a working subscription", () => {
    expect(readOnlyMessage({ kind: "trialing", daysLeft: 1 })).toBeNull();
    expect(readOnlyMessage({ kind: "active" })).toBeNull();
    expect(readOnlyMessage({ kind: "past_due" })).toBeNull();
    expect(readOnlyMessage({ kind: "none" })).toMatch(/Start your free trial/);
    expect(readOnlyMessage({ kind: "expired" })).toMatch(/subscription has ended/);
  });
});

function subscription(overrides: Partial<Stripe.Subscription> = {}): Stripe.Subscription {
  return {
    id: "sub_1",
    object: "subscription",
    customer: "cus_1",
    status: "active",
    cancel_at_period_end: false,
    cancel_at: null,
    metadata: { organization_id: ORG_ID },
    items: {
      object: "list",
      data: [{ current_period_end: 1_798_000_000, price: { recurring: { interval: "year" } } }],
    },
    ...overrides,
  } as unknown as Stripe.Subscription;
}

describe("subscriptionToRow", () => {
  it("maps status, interval and the item's period end", () => {
    expect(subscriptionToRow(subscription())).toEqual({
      stripe_customer_id: "cus_1",
      stripe_subscription_id: "sub_1",
      subscription_status: "active",
      plan_interval: "year",
      current_period_end: new Date(1_798_000_000 * 1000).toISOString(),
      cancel_at_period_end: false,
    });
  });

  it("treats a scheduled cancellation as cancelling", () => {
    expect(subscriptionToRow(subscription({ cancel_at: 1_798_000_000 })).cancel_at_period_end).toBe(true);
  });

  it("reads the organization from metadata and rejects anything else", () => {
    expect(subscriptionOrgId(subscription())).toBe(ORG_ID);
    expect(subscriptionOrgId(subscription({ metadata: {} }))).toBeNull();
    expect(subscriptionOrgId(subscription({ metadata: { organization_id: "x; drop" } }))).toBeNull();
  });
});

describe("shouldApply", () => {
  const row = (id: string, status: SubscriptionRow["subscription_status"]): SubscriptionRow => ({
    ...subscriptionToRow(subscription()),
    stripe_subscription_id: id,
    subscription_status: status,
  });

  it("applies updates to the same or a first subscription", () => {
    expect(shouldApply({ stripe_subscription_id: null, subscription_status: null }, row("sub_1", "active"))).toBe(true);
    expect(shouldApply({ stripe_subscription_id: "sub_1", subscription_status: "active" }, row("sub_1", "canceled"))).toBe(true);
  });

  it("ignores a late cancellation of an old subscription", () => {
    expect(shouldApply({ stripe_subscription_id: "sub_2", subscription_status: "active" }, row("sub_1", "canceled"))).toBe(false);
  });

  it("lets a new live subscription replace an ended one", () => {
    expect(shouldApply({ stripe_subscription_id: "sub_1", subscription_status: "canceled" }, row("sub_2", "active"))).toBe(true);
  });
});

describe("eventSubscriptionId", () => {
  const event = (object: Record<string, unknown>) => ({ data: { object } }) as unknown as Stripe.Event;

  it("finds the subscription on subscription and checkout events", () => {
    expect(eventSubscriptionId(event({ object: "subscription", id: "sub_1" }))).toBe("sub_1");
    expect(eventSubscriptionId(event({ object: "checkout.session", subscription: "sub_2" }))).toBe("sub_2");
    expect(eventSubscriptionId(event({ object: "checkout.session", subscription: null }))).toBeNull();
  });
});

describe("Stripe webhook route", () => {
  afterEach(() => vi.unstubAllEnvs());

  const SECRET = "whsec_test_secret";

  async function post(body: string, signature?: string) {
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_dummy");
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", SECRET);
    const { POST } = await import("@/app/api/webhooks/stripe/route");
    const headers = signature ? { "stripe-signature": signature } : undefined;
    return POST(new Request("http://localhost/api/webhooks/stripe", { method: "POST", body, headers }));
  }

  it("rejects requests without a signature", async () => {
    expect((await post("{}")).status).toBe(400);
  });

  it("rejects a wrong signature", async () => {
    expect((await post("{}", "t=1,v1=bad")).status).toBe(400);
  });

  it("accepts a signed event it doesn't handle", async () => {
    const payload = JSON.stringify({ id: "evt_1", object: "event", type: "invoice.paid", data: { object: {} } });
    const header = new Stripe("sk_test_dummy").webhooks.generateTestHeaderString({ payload, secret: SECRET });
    const response = await post(payload, header);
    expect(response.status).toBe(200);
  });
});

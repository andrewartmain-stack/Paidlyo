import type { FaqItem } from "./landing";

/*
 * The Paidlyo plan as shown on the public site.
 * Amounts must match the Stripe prices (STRIPE_PRICE_MONTHLY / STRIPE_PRICE_YEARLY): when you
 * change a price in Stripe, change it here too. The trial length matches TRIAL_DAYS in
 * features/billing/access.ts (the card-required Stripe trial).
 */
export const PLAN = {
  name: "Paidlyo",
  currency: "USD",
  monthlyCents: 900,
  yearlyCents: 9000,
  trialDays: 14,
} as const;

/** "$9", "$90" (whole dollars without cents, cents when there are any). */
export function formatPlanPrice(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: PLAN.currency,
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

/** Whole months saved by paying yearly (e.g. 2). */
export function yearlyMonthsFree(): number {
  return Math.round((PLAN.monthlyCents * 12 - PLAN.yearlyCents) / PLAN.monthlyCents);
}

export const PRICING_META = {
  title: "Pricing: $9 a Month, Everything Included | Paidlyo",
  description:
    "Paidlyo costs $9 a month or $90 a year with everything included: unlimited clients, projects and invoices. Try it free for 14 days, cancel any time.",
} as const;

export const PRICING_HERO = {
  eyebrow: "Pricing",
  title: "Simple pricing for freelancers",
  description: "One plan with everything included. No per-invoice fees, no feature tiers, no surprises.",
} as const;

export const PLAN_FEATURES: string[] = [
  "Unlimited clients, projects and tasks",
  "Timesheet, week view and timer",
  "Unlimited invoices from tracked time",
  "Branded invoice PDFs",
  "Free no-login invoice links for clients",
  "Payment tracking and partial payments",
  "Time, unbilled and outstanding reports",
  "CSV export of your data",
  "Import from Harvest",
  "Multiple currencies",
];

export const PRICING_FAQ: FaqItem[] = [
  {
    question: "Do I need a card for the free trial?",
    answer:
      "Yes. You add a card when you start your 14-day trial, but you're not charged anything until the trial ends. Cancel before then in Settings → Billing and you won't pay a cent.",
  },
  {
    question: "What happens when my trial ends?",
    answer:
      "Your subscription starts automatically and your card is charged for the plan you chose, monthly or yearly. We remind you before the trial ends, so there are no surprises.",
  },
  {
    question: "Can I cancel at any time?",
    answer:
      "Yes. Cancel from Settings → Billing in a couple of clicks. You keep full access until the end of the period you've paid for, and you're not charged again.",
  },
  {
    question: "Can I switch between monthly and yearly?",
    answer:
      "Yes. Change your plan from Settings → Billing whenever you like. The difference is prorated automatically.",
  },
  {
    question: "Do you offer refunds?",
    answer:
      "Payments for a period that has already started aren't refunded, but you can cancel any time so you're not charged again. If something went wrong, email support@paidlyo.com and we'll sort it out.",
  },
  {
    question: "Are there any extra fees?",
    answer:
      "No. The price covers every feature with unlimited clients, projects and invoices. Taxes such as VAT may be added depending on where you are.",
  },
  {
    question: "Is Paidlyo cheaper than Harvest?",
    answer:
      "For most freelancers, yes: Paidlyo is one flat price with everything included, and you can import your Harvest data in a few minutes to compare for yourself during the free trial.",
  },
];

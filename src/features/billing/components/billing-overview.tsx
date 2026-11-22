import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, todayIn } from "@/features/time/dates";
import { formatMoney } from "@/lib/money";
import { billingAccess, canWrite, trialEligible, type BillingAccess, type PlanInterval } from "../access";
import { openBillingPortal, syncSeatsNow } from "../actions";
import type { OrgBilling, PlanPrice } from "../queries";
import { peopleLabel, seatsOutOfSync, seatsToBill, seatTotalCents } from "../seat-count";
import type { SeatStatus } from "../seats";
import { PlanPicker } from "./plan-picker";

const PLAN_NAME: Record<PlanInterval, string> = { month: "Monthly plan", year: "Yearly plan" };

export const BILLING_ERRORS: Record<string, string> = {
  unavailable: "Billing isn't available right now. Please try again later.",
  checkout: "We couldn't open the checkout. Please try again.",
  portal: "We couldn't open the billing portal. Please try again.",
  seats: "We couldn't update your seats in Stripe. Please try again.",
};

function dateIn(timeZone: string, timestamp: string): string {
  return formatDate(todayIn(timeZone, new Date(timestamp)));
}

function StatusBadge({ access }: { access: BillingAccess }) {
  switch (access.kind) {
    case "trialing":
      return <Badge variant="secondary">Free trial</Badge>;
    case "active":
      return <Badge variant="success">Active</Badge>;
    case "past_due":
      return <Badge variant="warning">Payment failed</Badge>;
    case "expired":
      return <Badge variant="destructive">Ended</Badge>;
    case "none":
      return <Badge variant="outline">No plan</Badge>;
  }
}

function statusText(access: BillingAccess, billing: OrgBilling, timeZone: string): string {
  const plan = billing.interval ? PLAN_NAME[billing.interval] : "Your plan";
  const periodEnd = billing.currentPeriodEnd ? dateIn(timeZone, billing.currentPeriodEnd) : null;
  switch (access.kind) {
    case "trialing":
      if (!periodEnd) return `${plan}, free trial.`;
      return billing.cancelAtPeriodEnd
        ? `${plan} is canceled. Your free trial ends on ${periodEnd} and you won't be charged.`
        : `${plan}. Your free trial ends on ${periodEnd}, when your card is charged for the first time.`;
    case "active":
      if (!periodEnd) return `${plan} is active.`;
      return billing.cancelAtPeriodEnd ? `${plan} is canceled and ends on ${periodEnd}.` : `${plan}. Renews on ${periodEnd}.`;
    case "past_due":
      return "Your last payment didn't go through. Update your card to keep your account active.";
    case "expired":
      return "Your subscription has ended, so your account is read-only. Subscribe again to keep tracking time and sending invoices.";
    case "none":
      return "Choose a plan to start your free trial.";
  }
}

export function BillingOverview({
  billing,
  prices,
  timeZone,
  seats,
  checkoutSuccess,
  seatsSynced,
  error,
}: {
  billing: OrgBilling;
  prices: PlanPrice[] | null;
  timeZone: string;
  seats: SeatStatus;
  checkoutSuccess: boolean;
  seatsSynced: boolean;
  error: string | undefined;
}) {
  const access = billingAccess(billing, new Date());
  const live = canWrite(access);
  const message = error ? BILLING_ERRORS[error] : undefined;
  const price = prices?.find((p) => p.interval === billing.interval);
  const seatCount = seatsToBill(seats.activeMembers);
  const outOfSync = live && seatsOutOfSync(seats.billedSeats, seats.activeMembers);

  return (
    <div className="flex flex-col gap-6">
      {message && (
        <p role="alert" className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {message}
        </p>
      )}
      {seatsSynced && (
        <p role="status" className="rounded-lg bg-muted px-4 py-3 text-sm">
          Seats updated. Stripe will adjust your next invoice.
        </p>
      )}
      {checkoutSuccess && !live && (
        <p role="status" className="rounded-lg bg-muted px-4 py-3 text-sm">
          Thanks! We&apos;re confirming your payment with Stripe. Refresh in a few seconds.
        </p>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <CardTitle className="text-lg font-semibold">Paidlyo plan</CardTitle>
            <StatusBadge access={access} />
          </div>
          <CardDescription>{statusText(access, billing, timeZone)}</CardDescription>
        </CardHeader>
        {live && price && (
          <CardContent className="flex flex-col gap-3">
            <p className="text-sm">
              <span className="font-medium">{peopleLabel(seatCount)}</span> ×{" "}
              {formatMoney(price.amountCents, price.currency)} ={" "}
              <span className="font-semibold tabular-nums">
                {formatMoney(seatTotalCents(price.amountCents, seatCount), price.currency)}
              </span>{" "}
              / {price.interval}
            </p>
            <p className="text-xs text-muted-foreground">
              You pay for each active person. Adding or deactivating someone is prorated on your next invoice.
            </p>
            {outOfSync && (
              <form action={syncSeatsNow} className="flex flex-wrap items-center gap-3 rounded-lg bg-warning/10 px-4 py-3">
                <p className="flex-1 text-sm">
                  Stripe is billing for {peopleLabel(seats.billedSeats ?? 0)}, but your team has{" "}
                  {peopleLabel(seatCount)}.
                </p>
                <Button type="submit" size="sm" variant="outline">
                  Sync seats
                </Button>
              </form>
            )}
          </CardContent>
        )}
        {billing.stripeCustomerId && (
          <CardContent>
            <form action={openBillingPortal}>
              <Button type="submit" variant={live ? "default" : "outline"}>
                Manage billing
              </Button>
            </form>
            <p className="mt-2 text-xs text-muted-foreground">
              Change plan, update your card, download invoices or cancel on Stripe.
            </p>
          </CardContent>
        )}
      </Card>

      {!live && <PlanPicker prices={prices} from="billing" trial={trialEligible(billing)} />}
    </div>
  );
}

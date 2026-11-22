import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoney } from "@/lib/money";
import { TRIAL_DAYS, type PlanInterval } from "../access";
import { startCheckout } from "../actions";
import type { PlanPrice } from "../queries";

const INTERVAL_LABEL: Record<PlanInterval, { name: string; per: string }> = {
  month: { name: "Monthly", per: "month" },
  year: { name: "Yearly", per: "year" },
};

/** Monthly / yearly cards that start Stripe Checkout. */
export function PlanPicker({
  prices,
  from,
  trial,
}: {
  prices: PlanPrice[] | null;
  from: "subscribe" | "billing";
  trial: boolean;
}) {
  if (!prices) {
    return (
      <p className="rounded-lg bg-muted px-4 py-3 text-sm">Plans aren&apos;t available right now. Please try again later.</p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {prices.map((price) => {
        const label = INTERVAL_LABEL[price.interval];
        const amount = formatMoney(price.amountCents, price.currency);
        return (
          <Card key={price.interval}>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">{label.name}</CardTitle>
              <CardDescription>
                <span className="text-2xl font-semibold text-foreground tabular-nums">{amount}</span> per person /{" "}
                {label.per}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <form action={startCheckout}>
                <input type="hidden" name="interval" value={price.interval} />
                <input type="hidden" name="from" value={from} />
                <Button type="submit" variant={price.interval === "year" ? "default" : "outline"} className="w-full">
                  {trial ? "Start free trial" : `Subscribe ${label.name.toLowerCase()}`}
                </Button>
              </form>
              {trial && (
                <p className="text-xs text-muted-foreground">
                  {TRIAL_DAYS} days free, then {amount} per person per {label.per}. Cancel any time.
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { formatPlanPrice, PLAN, PLAN_FEATURES, yearlyMonthsFree } from "@/content/pricing";

/** The single Paidlyo plan with both billing options. Static server component. */
export function PricingPlan() {
  return (
    <div className="mx-auto grid max-w-4xl overflow-hidden rounded-3xl border bg-card md:grid-cols-[1fr_1.2fr]">
      <div className="flex flex-col gap-6 bg-accent p-8 sm:p-10">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl">{PLAN.name}</h2>
          <p className="text-sm text-muted-foreground">Everything included</p>
        </div>
        <div className="flex flex-col gap-2">
          <p className="flex items-baseline gap-2">
            <span className="text-5xl font-semibold tabular-nums">{formatPlanPrice(PLAN.monthlyCents)}</span>
            <span className="text-muted-foreground">per person / month</span>
          </p>
          <p className="text-sm">
            or <span className="font-semibold">{formatPlanPrice(PLAN.yearlyCents)} per person / year</span>
            <span className="ml-2 rounded-full bg-background px-2 py-0.5 text-xs font-medium">
              {yearlyMonthsFree()} months free
            </span>
          </p>
        </div>
        <div className="mt-auto flex flex-col gap-2">
          <Link href="/signup" className={buttonVariants({ size: "lg" })}>
            Start your free trial
            <ArrowRight aria-hidden />
          </Link>
          <p className="text-center text-xs text-muted-foreground">
            {PLAN.trialDays} days free · Cancel any time before you&apos;re charged
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-4 p-8 sm:p-10">
        <h3 className="text-base font-semibold">What&apos;s included</h3>
        <ul className="grid gap-3 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2">
          {PLAN_FEATURES.map((feature) => (
            <li key={feature} className="flex gap-2 text-sm">
              <Check className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
              {feature}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { getCurrentUser } from "@/features/auth/queries";
import { firstName, greeting, hourIn } from "@/features/dashboard/compute";
import {
  GettingStarted,
  NeedsAttention,
  RecentInvoices,
  RecentTime,
  StatCards,
  WeekChart,
} from "@/features/dashboard/components/dashboard-sections";
import { canManageOrg, getCurrentOrg } from "@/features/organizations/queries";
import { todayIn } from "@/features/time/dates";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <Dashboard />
    </Suspense>
  );
}

function Block({ className }: { className: string }) {
  return <div className={`rounded-xl bg-muted ${className}`} />;
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Block className="h-9 w-64" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Block key={i} className="h-28" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Block className="h-72 lg:col-span-2" />
        <Block className="h-72" />
      </div>
    </div>
  );
}

async function Dashboard() {
  const [org, user] = await Promise.all([getCurrentOrg(), getCurrentUser()]);
  const now = new Date();
  const today = todayIn(org.timezone, now);
  const manager = canManageOrg(org);
  const name = firstName(user.fullName);
  const props = { org, today, nowMs: now.getTime() };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl">
            {greeting(hourIn(org.timezone, now))}
            {name ? `, ${name}` : ""}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Here&apos;s how {org.name} is doing.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {manager && (
            <Link href="/app/invoices/new" className={buttonVariants({ variant: "outline" })}>
              New invoice
            </Link>
          )}
          <Link href="/app/time?track=1" className={buttonVariants()}>
            <Plus aria-hidden />
            Track time
          </Link>
        </div>
      </div>

      {manager && (
        <Suspense fallback={null}>
          <GettingStarted {...props} />
        </Suspense>
      )}

      <Suspense
        fallback={
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <Block key={i} className="h-28" />
            ))}
          </div>
        }
      >
        <StatCards {...props} manager={manager} />
      </Suspense>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Suspense fallback={<Block className="h-64" />}>
            <WeekChart {...props} />
          </Suspense>
          <Suspense fallback={<Block className="h-64" />}>
            <RecentTime {...props} />
          </Suspense>
        </div>
        {manager && (
          <div className="flex flex-col gap-6">
            <Suspense fallback={<Block className="h-48" />}>
              <NeedsAttention {...props} />
            </Suspense>
            <Suspense fallback={<Block className="h-64" />}>
              <RecentInvoices {...props} />
            </Suspense>
          </div>
        )}
      </div>
    </div>
  );
}

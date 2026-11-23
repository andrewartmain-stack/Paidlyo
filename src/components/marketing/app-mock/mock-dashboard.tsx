import { AlertTriangle, ArrowRight, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatCard, StatusChip } from "./mock-parts";
import { MockWindow } from "./mock-window";

const BARS = [
  { day: "Mon", label: "7:30", height: 94 },
  { day: "Tue", label: "8:00", height: 100 },
  { day: "Wed", label: "6:30", height: 80 },
  { day: "Thu", label: "7:18", height: 92 },
  { day: "Fri", label: "3:12", height: 40, today: true },
  { day: "Sat", label: "", height: 0 },
  { day: "Sun", label: "", height: 0 },
];

const INVOICES = [
  { id: "INV-0041", client: "Brightline", tone: "success", status: "Paid", amount: "$4,980.00" },
  { id: "INV-0040", client: "Halden & Co.", tone: "danger", status: "Overdue", amount: "$2,350.00" },
  { id: "INV-0039", client: "Northwind", tone: "success", status: "Paid", amount: "$6,115.00" },
] as const;

type MockDashboardProps = {
  /** Show the app sidebar (only when the window is wide enough). Pass false for narrow spaces. Default true. */
  sidebar?: boolean;
  className?: string;
};

/** Static, server-rendered Paidlyo dashboard. Works standalone; fluid width. */
export function MockDashboard({ sidebar = true, className }: MockDashboardProps) {
  return (
    <MockWindow
      active="Dashboard"
      sidebar={sidebar}
      className={className}
      description="Preview of the Paidlyo dashboard showing hours this week, unbilled and outstanding amounts, a weekly chart, items needing attention and recent invoices."
    >
      <div className="flex flex-col gap-3 text-[11px]" aria-hidden="true">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-heading text-base font-semibold tracking-tight">Good afternoon, Andrew</p>
            <p className="text-muted-foreground">Here&apos;s how Northpeak Studio is doing.</p>
          </div>
          <div className="hidden gap-1.5 @md:flex">
            <span className="inline-flex h-7 items-center rounded-full border px-3 font-medium">New invoice</span>
            <span className="inline-flex h-7 items-center gap-1 rounded-full bg-primary px-3 font-medium text-primary-foreground">
              <Plus className="size-3" /> Track time
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 @2xl:grid-cols-4">
          <StatCard label="Hours this week" value="32:30" hint="84% billable" />
          <StatCard label="Unbilled" value="$7,270.00" hint="51:00 for 1 client" />
          <StatCard label="Outstanding" value="$2,350.00" hint="1 overdue invoice" />
          <StatCard label="Paid this month" value="$11,420.00" hint="Payments recorded" />
        </div>

        <div className="grid gap-2 @2xl:grid-cols-[3fr_2fr]">
          <div className="rounded-xl border p-3">
            <div className="flex items-baseline justify-between">
              <p className="font-heading text-[13px] font-semibold">This week</p>
              <span className="text-[10px] font-medium text-brand">Timesheet</span>
            </div>
            <p className="text-muted-foreground">32:30 tracked &middot; 27:15 billable</p>
            <div className="mt-3 grid h-28 grid-cols-7 items-end gap-1.5">
              {BARS.map((b) => (
                <div key={b.day} className="group flex h-full flex-col items-center justify-end gap-1">
                  <span className="text-[9px] text-muted-foreground tabular-nums opacity-0 transition-opacity group-hover:opacity-100 @md:opacity-100">{b.label}</span>
                  <div className="flex w-full flex-1 items-end rounded-md bg-muted/60">
                    <div
                      className={cn("w-full rounded-md transition-colors", b.today ? "bg-brand" : "bg-primary/80 group-hover:bg-primary")}
                      style={{ height: `${b.height}%` }}
                    />
                  </div>
                  <span className={cn("text-[9px] text-muted-foreground", b.today && "font-semibold text-foreground")}>{b.day}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="rounded-xl border p-3">
              <p className="mb-1.5 font-heading text-[13px] font-semibold">Needs attention</p>
              <p className="flex gap-1.5 leading-snug">
                <AlertTriangle className="mt-0.5 size-3 shrink-0 text-warning" />
                INV-0040 to Halden &amp; Co. is 1 day overdue &middot; $2,350.00
              </p>
              <p className="mt-1.5 flex gap-1.5 leading-snug">
                <ArrowRight className="mt-0.5 size-3 shrink-0" />
                $7,270.00 unbilled for Acme Co.
              </p>
            </div>
            <div className="rounded-xl border p-3">
              <div className="flex items-baseline justify-between">
                <p className="font-heading text-[13px] font-semibold">Recent invoices</p>
                <span className="text-[10px] font-medium text-brand">View all</span>
              </div>
              <ul className="mt-1">
                {INVOICES.map((i) => (
                  <li key={i.id} className="-mx-1.5 flex items-center justify-between gap-2 rounded-md px-1.5 py-1.5 transition-colors hover:bg-muted/60">
                    <span className="min-w-0 leading-tight">
                      <span className="block font-medium">{i.id}</span>
                      <span className="block truncate text-[10px] text-muted-foreground">{i.client}</span>
                    </span>
                    <StatusChip tone={i.tone}>{i.status}</StatusChip>
                    <span className="font-medium tabular-nums">{i.amount}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </MockWindow>
  );
}

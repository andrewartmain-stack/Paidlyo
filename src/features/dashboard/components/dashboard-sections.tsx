import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Gauge,
  CalendarClock,
  ClipboardCheck,
  Check,
  Circle,
  Clock,
  FileClock,
  FileUp,
  Hourglass,
  type LucideIcon,
  Timer,
  Wallet,
} from "lucide-react";
import { ImportIllustration } from "@/components/illustrations";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InvoiceStatusBadge } from "@/features/invoices/components/invoice-status-badge";
import type { CurrentOrg } from "@/features/organizations/types";
import { countPendingSubmissions } from "@/features/approvals/queries";
import { listBudgetAlerts } from "@/features/projects/queries";
import { formatMoneyTotals, percentOf } from "@/features/reports/aggregate";
import { agingSummary } from "@/features/reports/outstanding";
import { unbilledSummary } from "@/features/reports/unbilled";
import { formatShortDate, weekDays } from "@/features/time/dates";
import { formatDuration, liveMinutes } from "@/features/time/duration";
import { totalsByDate } from "@/features/time/queries";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import { attentionItems, checklistDone, checklistSteps, monthStart, weekBars, type AttentionItem } from "../compute";
import { getMoneyOverview, getMyRecentEntries, getPaidBetween, getSetupCounts, listRecentInvoices } from "../queries";

/** `nowMs`: the moment the page renders, so running timers count the same in every section. */
type SectionProps = { org: CurrentOrg; today: string; nowMs: number };

const cardTitle = "text-base font-semibold";

// ---------------------------------------------------------------------------
// Getting started (owners/admins, until every step is done)
// ---------------------------------------------------------------------------

export async function GettingStarted({ org }: SectionProps) {
  const steps = checklistSteps(await getSetupCounts(org.id));
  if (checklistDone(steps)) return null;
  const done = steps.filter((step) => step.done).length;

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2">
        <div className="flex flex-col gap-1">
          <CardTitle className={cardTitle}>Getting started</CardTitle>
          <CardDescription>A few steps to your first paid invoice.</CardDescription>
        </div>
        <span className="text-sm text-muted-foreground tabular-nums">
          {done} of {steps.length} done
        </span>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-brand" style={{ width: `${percentOf(done, steps.length)}%` }} />
        </div>
        <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {steps.map((step) => (
            <li key={step.key}>
              <Link
                href={step.href}
                className={cn(
                  "flex h-full items-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition-colors hover:bg-muted",
                  step.done && "text-muted-foreground line-through",
                )}
              >
                {step.done ? (
                  <Check className="size-4 shrink-0 text-success" aria-hidden />
                ) : (
                  <Circle className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                )}
                <span className="sr-only">{step.done ? "Done: " : "To do: "}</span>
                {step.label}
              </Link>
            </li>
          ))}
        </ol>
        <Link
          href="/app/settings/import"
          className="group/import flex items-center gap-4 rounded-xl bg-accent/60 p-3 pr-5 transition-colors hover:bg-accent"
        >
          <ImportIllustration className="h-16 w-auto shrink-0" />
          <span className="flex flex-col gap-0.5">
            <span className="flex items-center gap-1.5 text-sm font-medium">
              <FileUp className="size-4 text-brand" aria-hidden />
              Coming from Harvest?
            </span>
            <span className="text-sm text-muted-foreground">
              Import your clients, projects, tasks and time in a few minutes.
            </span>
          </span>
          <ArrowRight
            className="ml-auto size-4 shrink-0 text-brand transition-transform motion-safe:group-hover/import:translate-x-1"
            aria-hidden
          />
        </Link>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Number cards
// ---------------------------------------------------------------------------

function StatCard({
  label,
  value,
  detail,
  href,
  icon: Icon,
}: {
  label: string;
  value: string;
  detail: string;
  href: string;
  icon: LucideIcon;
}) {
  return (
    <Link href={href} className="group rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <Card className="h-full transition-colors group-hover:bg-muted/50">
        <CardHeader className="gap-1">
          <div className="flex items-center justify-between gap-2">
            <CardDescription>{label}</CardDescription>
            <span className="flex size-8 items-center justify-center rounded-full bg-accent text-brand transition-transform duration-200 motion-safe:group-hover:scale-110">
              <Icon className="size-4" aria-hidden />
            </span>
          </div>
          <CardTitle className="text-2xl font-semibold tabular-nums">{value}</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground">{detail}</CardContent>
      </Card>
    </Link>
  );
}

function myWeekNumbers(entries: Awaited<ReturnType<typeof getMyRecentEntries>>, today: string, nowMs: number) {
  const days = weekDays(today);
  const inWeek = entries.filter((entry) => entry.spentDate >= days[0] && entry.spentDate <= days[6]);
  let minutes = 0;
  let billable = 0;
  for (const entry of inWeek) {
    const live = liveMinutes(entry.minutes, entry.timerStartedAt, nowMs);
    minutes += live;
    if (entry.isBillable) billable += live;
  }
  return { days, inWeek, minutes, billable };
}

export async function StatCards({ org, today, nowMs, manager }: SectionProps & { manager: boolean }) {
  const entries = await getMyRecentEntries(today);
  const week = myWeekNumbers(entries, today, nowMs);
  const todayMinutes = totalsByDate(week.inWeek, nowMs).get(today) ?? 0;

  const hoursCard = (
    <StatCard
      label="Hours this week"
      icon={Clock}
      value={formatDuration(week.minutes)}
      detail={week.minutes > 0 ? `${percentOf(week.billable, week.minutes)}% billable` : "Nothing tracked yet"}
      href="/app/time?view=week"
    />
  );

  if (!manager) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        {hoursCard}
        <StatCard label="Today" icon={CalendarClock} value={formatDuration(todayMinutes)} detail="Your tracked time today" href="/app/time" />
      </div>
    );
  }

  const [money, paid] = await Promise.all([getMoneyOverview(org, today), getPaidBetween(org.id, monthStart(today), today)]);
  const unbilled = unbilledSummary(money.unbilledClients);
  const unbilledClients = money.unbilledClients.filter((client) => client.amountCents > 0).length;
  const outstanding = agingSummary(money.outstanding);
  const overdue = money.outstanding.filter((invoice) => invoice.daysOverdue > 0).length;

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {hoursCard}
      <StatCard
        label="Unbilled"
        icon={Hourglass}
        value={formatMoneyTotals(unbilled.amount, org.currency)}
        detail={
          unbilledClients > 0
            ? `${formatDuration(unbilled.minutes)} for ${unbilledClients} ${unbilledClients === 1 ? "client" : "clients"}`
            : "All billable time is invoiced"
        }
        href="/app/reports/unbilled"
      />
      <StatCard
        label="Outstanding"
        icon={FileClock}
        value={formatMoneyTotals(outstanding.total, org.currency)}
        detail={
          money.outstanding.length === 0
            ? "No open invoices"
            : overdue > 0
              ? `${overdue} overdue ${overdue === 1 ? "invoice" : "invoices"}`
              : `${money.outstanding.length} open, none overdue`
        }
        href="/app/reports/outstanding"
      />
      <StatCard
        label="Paid this month"
        icon={Wallet}
        value={formatMoneyTotals(paid, org.currency)}
        detail="Payments recorded this month"
        href="/app/invoices?status=paid"
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// This week chart
// ---------------------------------------------------------------------------

export async function WeekChart({ today, nowMs }: SectionProps) {
  const entries = await getMyRecentEntries(today);
  const week = myWeekNumbers(entries, today, nowMs);
  const bars = weekBars(week.days, totalsByDate(week.inWeek, nowMs), today);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <div className="flex flex-col gap-1">
          <CardTitle className={cardTitle}>This week</CardTitle>
          <CardDescription>
            {formatDuration(week.minutes)} tracked · {formatDuration(week.billable)} billable
          </CardDescription>
        </div>
        <Link href="/app/time?view=week" className="text-sm text-brand underline-offset-4 hover:underline">
          Timesheet
        </Link>
      </CardHeader>
      <CardContent>
        <ol className="flex h-44 items-end gap-2 sm:gap-3" aria-label="Hours per day this week">
          {bars.map((bar) => (
            <li key={bar.date} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
              <span className="text-xs text-muted-foreground tabular-nums">
                {bar.minutes > 0 ? formatDuration(bar.minutes) : ""}
              </span>
              <div className="flex w-full flex-1 items-end rounded-md bg-muted/60">
                <div
                  className={cn("w-full rounded-md", bar.isToday ? "bg-brand" : "bg-primary/70")}
                  style={{ height: `${Math.max(bar.minutes > 0 ? 4 : 0, bar.heightPct)}%` }}
                />
              </div>
              <span className={cn("text-xs", bar.isToday ? "font-semibold" : "text-muted-foreground")}>
                {bar.label}
                <span className="sr-only">: {formatDuration(bar.minutes)}</span>
              </span>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Recent time
// ---------------------------------------------------------------------------

export async function RecentTime({ today, nowMs }: SectionProps) {
  const entries = (await getMyRecentEntries(today)).filter((entry) => entry.spentDate <= today).reverse().slice(0, 5);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <CardTitle className={cardTitle}>Recent time</CardTitle>
        <Link href="/app/time" className="text-sm text-brand underline-offset-4 hover:underline">
          View all
        </Link>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <div className="flex flex-col items-start gap-3 rounded-lg border border-dashed px-4 py-6">
            <p className="text-sm text-muted-foreground">No time tracked in the last 30 days.</p>
            <Link href="/app/time?track=1" className={buttonVariants({ size: "sm" })}>
              <Clock aria-hidden />
              Track time
            </Link>
          </div>
        ) : (
          <ul className="flex flex-col divide-y">
            {entries.map((entry) => (
              <li key={entry.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                <span className="w-14 shrink-0 text-xs text-muted-foreground">
                  {entry.spentDate === today ? "Today" : formatShortDate(entry.spentDate)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {entry.project.name} <span className="font-normal text-muted-foreground">· {entry.task.name}</span>
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{entry.notes || entry.project.clientName}</p>
                </div>
                <span className="flex items-center gap-1 text-sm tabular-nums">
                  {entry.timerStartedAt && <Timer className="size-3.5 text-brand" aria-label="Timer running" />}
                  {formatDuration(liveMinutes(entry.minutes, entry.timerStartedAt, nowMs))}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Needs attention
// ---------------------------------------------------------------------------

function AttentionRow({ item }: { item: AttentionItem }) {
  switch (item.kind) {
    case "timer":
      return (
        <Link href="/app/time" className="flex items-start gap-3 rounded-lg p-2 hover:bg-muted">
          <Timer className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
          <span className="text-sm">
            Timer running on <span className="font-medium">{item.label}</span>
          </span>
        </Link>
      );
    case "overdue":
      return (
        <Link href={`/app/invoices/${item.invoiceId}`} className="flex items-start gap-3 rounded-lg p-2 hover:bg-muted">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
          <span className="text-sm">
            <span className="font-medium">{item.number}</span> to {item.clientName} is {item.daysOverdue}{" "}
            {item.daysOverdue === 1 ? "day" : "days"} overdue ·{" "}
            <span className="tabular-nums">{formatMoney(item.balanceCents, item.currency)}</span>
          </span>
        </Link>
      );
    case "timesheets":
      return (
        <Link href="/app/approvals" className="flex items-start gap-3 rounded-lg p-2 hover:bg-muted">
          <ClipboardCheck className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
          <span className="text-sm">
            <span className="font-medium tabular-nums">{item.count}</span>{" "}
            {item.count === 1 ? "timesheet is" : "timesheets are"} waiting for your approval
          </span>
        </Link>
      );
    case "budget":
      return (
        <Link href={`/app/projects/${item.projectId}/edit`} className="flex items-start gap-3 rounded-lg p-2 hover:bg-muted">
          <Gauge className={cn("mt-0.5 size-4 shrink-0", item.over ? "text-destructive" : "text-warning")} aria-hidden />
          <span className="text-sm">
            <span className="font-medium">{item.projectName}</span> ({item.clientName}){" "}
            {item.over ? "is over budget" : "is at"} <span className="tabular-nums">{item.pct}%</span>
            {item.over ? "" : " of its budget"}
          </span>
        </Link>
      );
    case "unbilled":
      return (
        <Link
          href={`/app/invoices/new?client=${item.clientId}&source=time`}
          className="flex items-start gap-3 rounded-lg p-2 hover:bg-muted"
        >
          <ArrowRight className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
          <span className="text-sm">
            <span className="tabular-nums">{formatMoney(item.amountCents, item.currency)}</span> unbilled for{" "}
            <span className="font-medium">{item.clientName}</span> ({formatDuration(item.minutes)}). Create invoice
          </span>
        </Link>
      );
  }
}

function attentionKey(item: AttentionItem): string {
  switch (item.kind) {
    case "timer":
      return `timer-${item.entryId}`;
    case "overdue":
      return `overdue-${item.invoiceId}`;
    case "timesheets":
      return "timesheets";
    case "budget":
      return `budget-${item.projectId}`;
    case "unbilled":
      return `unbilled-${item.clientId}`;
  }
}

export async function NeedsAttention({ org, today, nowMs }: SectionProps) {
  const [entries, money, budgetAlerts, pendingTimesheets] = await Promise.all([
    getMyRecentEntries(today),
    getMoneyOverview(org, today),
    listBudgetAlerts(org.id, nowMs),
    org.timesheetApproval ? countPendingSubmissions(org.id) : Promise.resolve(0),
  ]);
  const running = entries.find((entry) => entry.timerStartedAt);
  const items = attentionItems({
    runningTimer: running
      ? { entryId: running.id, label: `${running.project.name} · ${running.task.name}`, startedAt: running.timerStartedAt! }
      : null,
    outstanding: money.outstanding,
    unbilledClients: money.unbilledClients,
    budgetAlerts,
    pendingTimesheets,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className={cardTitle}>Needs attention</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Check className="size-4 text-success" aria-hidden />
            You&apos;re all caught up.
          </p>
        ) : (
          <ul className="-m-2 flex flex-col">
            {items.map((item) => (
              <li key={attentionKey(item)}>
                <AttentionRow item={item} />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Recent invoices
// ---------------------------------------------------------------------------

export async function RecentInvoices({ org, today }: SectionProps) {
  const invoices = await listRecentInvoices(org.id, today);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <CardTitle className={cardTitle}>Recent invoices</CardTitle>
        <Link href="/app/invoices" className="text-sm text-brand underline-offset-4 hover:underline">
          View all
        </Link>
      </CardHeader>
      <CardContent>
        {invoices.length === 0 ? (
          <div className="flex flex-col items-start gap-3 rounded-lg border border-dashed px-4 py-6">
            <p className="text-sm text-muted-foreground">No invoices yet. Turn tracked time into one in a click.</p>
            <Link href="/app/invoices/new" className={buttonVariants({ size: "sm", variant: "outline" })}>
              New invoice
            </Link>
          </div>
        ) : (
          <ul className="flex flex-col divide-y">
            {invoices.map((invoice) => (
              <li key={invoice.id}>
                <Link
                  href={`/app/invoices/${invoice.id}`}
                  className="flex items-center gap-3 py-2.5 hover:text-brand"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{invoice.number}</p>
                    <p className="truncate text-xs text-muted-foreground">{invoice.client.name}</p>
                  </div>
                  <InvoiceStatusBadge status={invoice.displayStatus} />
                  <span className="w-24 text-right text-sm tabular-nums">
                    {formatMoney(invoice.totalCents, invoice.currency)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { ReportsIllustration } from "@/components/illustrations";
import { EmptyState } from "@/components/empty-state";
import { StatusTabs } from "@/components/status-tabs";
import { canManageOrg, getCurrentOrg } from "@/features/organizations/queries";
import { groupEntries, summarize } from "@/features/reports/aggregate";
import { ReportFilters } from "@/features/reports/components/report-filters";
import { ReportGroupTable } from "@/features/reports/components/report-group-table";
import { ReportHeader, TruncatedNotice } from "@/features/reports/components/report-header";
import { ReportSummary } from "@/features/reports/components/report-summary";
import { reportHref, resolveReportRange } from "@/features/reports/periods";
import { MAX_REPORT_ENTRIES, listReportEntries } from "@/features/reports/queries";
import { REPORT_GROUPS, reportFiltersSchema } from "@/features/reports/schemas";
import { formatWeekRange, todayIn } from "@/features/time/dates";

export const metadata: Metadata = { title: "Reports" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default function ReportsPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <div className="flex flex-col gap-6">
      <Suspense fallback={<ReportSkeleton />}>
        <Report searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Report({ searchParams }: { searchParams: SearchParams }) {
  const filters = reportFiltersSchema.parse(await searchParams);
  const org = await getCurrentOrg();
  if (!canManageOrg(org)) redirect("/app/time");

  const today = todayIn(org.timezone);
  const range = resolveReportRange(filters, today);
  const { group } = filters;
  const { entries, truncated } = await listReportEntries(org, range);
  const summary = summarize(entries);
  const rows = groupEntries(entries, group);

  return (
    <>
      <ReportHeader
        active="time"
        description={`Time tracked ${formatWeekRange([range.from, range.to], today)}`}
        exportHref={entries.length > 0 ? reportHref("/app/reports/export", range, group) : undefined}
      />

      <ReportFilters range={range} group={group} today={today} />

      {truncated && <TruncatedNotice max={MAX_REPORT_ENTRIES} hint="Choose a shorter period." />}

      {entries.length === 0 ? (
        <EmptyState
          illustration={<ReportsIllustration className="h-32 w-auto" />}
          title="No time in this period"
          description="Time tracked in this period will show up here. Try another period."
        />
      ) : (
        <>
          <ReportSummary summary={summary} currency={org.currency} />
          <div className="flex flex-col gap-3">
            <StatusTabs
              label="Group hours by"
              tabs={REPORT_GROUPS.map((g) => ({
                href: reportHref("/app/reports", range, g.value),
                label: g.label,
                active: group === g.value,
              }))}
            />
            <ReportGroupTable rows={rows} group={group} totalMinutes={summary.minutes} currency={org.currency} />
          </div>
        </>
      )}
    </>
  );
}

function ReportSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading report" className="flex flex-col gap-6">
      <div className="h-14 w-64 rounded-lg bg-muted" />
      <div className="h-9 w-72 rounded-lg bg-muted" />
      <div className="h-9 w-full max-w-xl rounded-lg bg-muted" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-28 rounded-xl bg-muted" />
        ))}
      </div>
      <div className="h-80 rounded-xl bg-muted" />
    </div>
  );
}

import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { SuccessIllustration } from "@/components/illustrations";
import { EmptyState } from "@/components/empty-state";
import { canManageOrg, getCurrentOrg } from "@/features/organizations/queries";
import { ReportHeader, TruncatedNotice } from "@/features/reports/components/report-header";
import { UnbilledReport } from "@/features/reports/components/unbilled-report";
import { MAX_REPORT_ENTRIES, listUnbilledEntries } from "@/features/reports/queries";
import { groupUnbilled, unbilledSummary } from "@/features/reports/unbilled";

export const metadata: Metadata = { title: "Unbilled time" };

export default function UnbilledReportPage() {
  return (
    <div className="flex flex-col gap-6">
      <Suspense fallback={<ReportSkeleton />}>
        <Unbilled />
      </Suspense>
    </div>
  );
}

async function Unbilled() {
  const org = await getCurrentOrg();
  if (!canManageOrg(org)) redirect("/app/time");

  const { entries, truncated } = await listUnbilledEntries(org);
  const clients = groupUnbilled(entries);

  return (
    <>
      <ReportHeader
        active="unbilled"
        description="Billable time that isn't on an invoice yet."
        exportHref={clients.length > 0 ? "/app/reports/export?report=unbilled" : undefined}
      />
      {truncated && <TruncatedNotice max={MAX_REPORT_ENTRIES} hint="Invoice older time to see the rest." />}
      {clients.length === 0 ? (
        <EmptyState
          illustration={<SuccessIllustration className="h-32 w-auto" />}
          title="Nothing unbilled"
          description="All billable time is on an invoice. Nice work."
        />
      ) : (
        <UnbilledReport clients={clients} summary={unbilledSummary(clients)} currency={org.currency} />
      )}
    </>
  );
}

function ReportSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading report" className="flex flex-col gap-6">
      <div className="h-14 w-64 rounded-lg bg-muted" />
      <div className="h-9 w-72 rounded-lg bg-muted" />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="h-24 rounded-xl bg-muted" />
        <div className="h-24 rounded-xl bg-muted" />
      </div>
      <div className="h-80 rounded-xl bg-muted" />
    </div>
  );
}

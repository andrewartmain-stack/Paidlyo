import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { SuccessIllustration } from "@/components/illustrations";
import { EmptyState } from "@/components/empty-state";
import { canManageOrg, getCurrentOrg } from "@/features/organizations/queries";
import { OutstandingReport } from "@/features/reports/components/outstanding-report";
import { ReportHeader, TruncatedNotice } from "@/features/reports/components/report-header";
import { agingSummary, toOutstanding } from "@/features/reports/outstanding";
import { MAX_REPORT_ENTRIES, listOpenInvoices } from "@/features/reports/queries";
import { todayIn } from "@/features/time/dates";

export const metadata: Metadata = { title: "Outstanding invoices" };

export default function OutstandingReportPage() {
  return (
    <div className="flex flex-col gap-6">
      <Suspense fallback={<ReportSkeleton />}>
        <Outstanding />
      </Suspense>
    </div>
  );
}

async function Outstanding() {
  const org = await getCurrentOrg();
  if (!canManageOrg(org)) redirect("/app/time");

  const { invoices: open, truncated } = await listOpenInvoices(org);
  const invoices = toOutstanding(open, todayIn(org.timezone));

  return (
    <>
      <ReportHeader
        active="outstanding"
        description="Sent invoices that haven't been paid in full."
        exportHref={invoices.length > 0 ? "/app/reports/export?report=outstanding" : undefined}
      />
      {truncated && <TruncatedNotice max={MAX_REPORT_ENTRIES} hint="The rest are left out of this view." />}
      {invoices.length === 0 ? (
        <EmptyState
          illustration={<SuccessIllustration className="h-32 w-auto" />}
          title="Nothing outstanding"
          description="Every sent invoice has been paid in full."
        />
      ) : (
        <OutstandingReport invoices={invoices} summary={agingSummary(invoices)} currency={org.currency} />
      )}
    </>
  );
}

function ReportSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading report" className="flex flex-col gap-6">
      <div className="h-14 w-64 rounded-lg bg-muted" />
      <div className="h-9 w-72 rounded-lg bg-muted" />
      <div className="h-24 rounded-xl bg-muted" />
      <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-5">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="h-24 rounded-xl bg-muted" />
        ))}
      </div>
      <div className="h-80 rounded-xl bg-muted" />
    </div>
  );
}

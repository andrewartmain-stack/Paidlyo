import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ClipboardCheck } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { PageIcon } from "@/components/page-icon";
import { StatusTabs } from "@/components/status-tabs";
import { buttonVariants } from "@/components/ui/button";
import { ApprovalsTable } from "@/features/approvals/components/approvals-table";
import { listSubmissions } from "@/features/approvals/queries";
import { APPROVAL_TABS } from "@/features/approvals/rules";
import { approvalsTabSchema } from "@/features/approvals/schemas";
import { canManageOrg, getCurrentOrg } from "@/features/organizations/queries";
import { formatWeekRange, todayIn, weekDays } from "@/features/time/dates";

export const metadata: Metadata = { title: "Approvals" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default function ApprovalsPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <PageIcon icon={ClipboardCheck} />
        <div>
          <h1 className="text-3xl">Approvals</h1>
          <p className="mt-1 text-sm text-muted-foreground">Review the weeks your team has submitted.</p>
        </div>
      </div>
      <Suspense fallback={<div className="h-72 rounded-xl bg-muted" />}>
        <Approvals searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Approvals({ searchParams }: { searchParams: SearchParams }) {
  const { status } = approvalsTabSchema.parse(await searchParams);
  const org = await getCurrentOrg();
  if (!canManageOrg(org)) redirect("/app/time");

  if (!org.timesheetApproval) {
    return (
      <EmptyState
        title="Timesheet approval is off"
        description="Turn it on in Settings to have people submit their weeks for approval."
      >
        <Link href="/app/settings" className={buttonVariants({ variant: "outline" })}>
          Go to settings
        </Link>
      </EmptyState>
    );
  }

  const rows = await listSubmissions(org.id, status);
  const today = todayIn(org.timezone);
  const date = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: org.timezone });
  const weekLabels = Object.fromEntries(rows.map((r) => [r.id, formatWeekRange(weekDays(r.weekStart), today)]));
  const decidedLabels = Object.fromEntries(
    rows
      .filter((r) => r.decidedAt)
      .map((r) => [r.id, `${r.decidedByName ?? "a manager"} on ${date.format(new Date(r.decidedAt!))}`]),
  );

  return (
    <div className="flex flex-col gap-4">
      <StatusTabs
        label="Approval status"
        tabs={APPROVAL_TABS.map((tab) => ({
          href: tab.status === "submitted" ? "/app/approvals" : `/app/approvals?status=${tab.status}`,
          label: tab.label,
          active: tab.status === status,
        }))}
      />
      {rows.length > 0 ? (
        <ApprovalsTable rows={rows} weekLabels={weekLabels} decidedLabels={decidedLabels} />
      ) : (
        <EmptyState
          title={status === "submitted" ? "Nothing to review" : `No ${status} timesheets`}
          description={
            status === "submitted"
              ? "When someone submits a week, it shows up here."
              : "Timesheets you review appear here."
          }
        />
      )}
    </div>
  );
}

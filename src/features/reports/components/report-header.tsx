import { BarChart3, Download } from "lucide-react";
import { PageIcon } from "@/components/page-icon";
import { buttonVariants } from "@/components/ui/button";
import { StatusTabs } from "@/components/status-tabs";
import type { ReportKind } from "../schemas";

const TABS: { kind: ReportKind; label: string; href: string }[] = [
  { kind: "time", label: "Time", href: "/app/reports" },
  { kind: "unbilled", label: "Unbilled", href: "/app/reports/unbilled" },
  { kind: "outstanding", label: "Outstanding", href: "/app/reports/outstanding" },
];

/** Shared heading for the report pages: title, description, CSV export and report tabs. */
export function ReportHeader({
  active,
  description,
  exportHref,
}: {
  active: ReportKind;
  description: string;
  /** Omitted when there is nothing to export. */
  exportHref?: string;
}) {
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-4">
          <PageIcon icon={BarChart3} />
          <div>
            <h1 className="text-3xl">Reports</h1>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        {exportHref && (
          <a href={exportHref} download className={buttonVariants({ variant: "outline" })}>
            <Download aria-hidden />
            Export CSV
          </a>
        )}
      </div>
      <StatusTabs
        label="Report"
        tabs={TABS.map((tab) => ({ href: tab.href, label: tab.label, active: tab.kind === active }))}
      />
    </>
  );
}

/** Notice shown when a report hit the row cap. */
export function TruncatedNotice({ max, hint }: { max: number; hint: string }) {
  const limit = max.toLocaleString("en-US");
  return (
    <p role="status" className="rounded-lg bg-muted px-4 py-3 text-sm">
      Only the first {limit} records are included. {hint}
    </p>
  );
}

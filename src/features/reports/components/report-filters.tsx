import Form from "next/form";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { reportHref, resolveReportRange, type ReportRange } from "../periods";
import { DEFAULT_GROUP, REPORT_PERIODS, type ReportGroup } from "../schemas";

const PATH = "/app/reports";

/** Period presets plus a custom from/to range, all kept in the URL. */
export function ReportFilters({ range, group, today }: { range: ReportRange; group: ReportGroup; today: string }) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
      <nav aria-label="Report period" className="flex w-fit flex-wrap gap-1 rounded-lg bg-muted p-1">
        {REPORT_PERIODS.filter((p) => p.value !== "custom").map((preset) => {
          const active = range.period === preset.value;
          return (
            <Link
              key={preset.value}
              href={reportHref(PATH, resolveReportRange({ period: preset.value }, today), group)}
              aria-current={active ? "page" : undefined}
              className={cn(
                "rounded-md px-3 py-1 text-sm text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring",
                active && "bg-card font-medium text-foreground ring-1 ring-border",
              )}
            >
              {preset.label}
            </Link>
          );
        })}
      </nav>

      <Form action={PATH} className="flex flex-wrap items-end gap-2" aria-label="Custom period">
        <input type="hidden" name="period" value="custom" />
        {group !== DEFAULT_GROUP && <input type="hidden" name="group" value={group} />}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="report-from">From</Label>
          <Input key={`from-${range.from}`} id="report-from" name="from" type="date" defaultValue={range.from} required className="w-40" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="report-to">To</Label>
          <Input key={`to-${range.to}`} id="report-to" name="to" type="date" defaultValue={range.to} required className="w-40" />
        </div>
        <Button type="submit" variant={range.period === "custom" ? "default" : "outline"}>
          Apply
        </Button>
      </Form>
    </div>
  );
}

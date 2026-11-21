import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDuration } from "@/features/time/duration";
import { formatMoneyTotals, percentOf, type ReportGroupRow } from "../aggregate";
import { REPORT_GROUPS, type ReportGroup } from "../schemas";

/** Hours per client / project / task with a bar for each row's share of the period. */
export function ReportGroupTable({
  rows,
  group,
  totalMinutes,
  currency,
}: {
  rows: ReportGroupRow[];
  group: ReportGroup;
  totalMinutes: number;
  currency: string;
}) {
  const heading = REPORT_GROUPS.find((g) => g.value === group)?.column ?? "Name";

  return (
    <div className="rounded-xl border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-4">{heading}</TableHead>
            <TableHead className="text-right">Hours</TableHead>
            <TableHead className="hidden text-right sm:table-cell">Billable hours</TableHead>
            <TableHead className="pr-4 text-right">Billable amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const share = percentOf(row.minutes, totalMinutes);
            return (
              <TableRow key={row.key}>
                <TableCell className="py-3 pl-4">
                  <div className="flex flex-col gap-1.5">
                    <span className="font-medium">
                      {row.label}
                      {row.detail && <span className="font-normal text-muted-foreground"> · {row.detail}</span>}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-full max-w-48 overflow-hidden rounded-full bg-muted" aria-hidden>
                        <div className="h-full rounded-full bg-brand" style={{ width: `${share}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground tabular-nums">{share}%</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-right tabular-nums">{formatDuration(row.minutes)}</TableCell>
                <TableCell className="hidden text-right tabular-nums sm:table-cell">
                  {formatDuration(row.billableMinutes)}
                </TableCell>
                <TableCell className="pr-4 text-right tabular-nums">{formatMoneyTotals(row.amount, currency)}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

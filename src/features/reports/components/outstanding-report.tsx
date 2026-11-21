import Link from "next/link";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import { formatDate } from "@/features/time/dates";
import { formatMoneyTotals } from "../aggregate";
import { AGING_BUCKETS, type AgingSummary, type OutstandingInvoice } from "../outstanding";

function overdueLabel(days: number): string {
  if (days < 0) return `Due in ${-days} day${days === -1 ? "" : "s"}`;
  if (days === 0) return "Due today";
  return `${days} day${days === 1 ? "" : "s"} overdue`;
}

/** Balance due by age, plus every open invoice, most overdue first. */
export function OutstandingReport({
  invoices,
  summary,
  currency,
}: {
  invoices: OutstandingInvoice[];
  summary: AgingSummary;
  currency: string;
}) {
  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="gap-1">
          <CardDescription>Total outstanding</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums">{formatMoneyTotals(summary.total, currency)}</CardTitle>
        </CardHeader>
      </Card>
      <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-5">
        {AGING_BUCKETS.map((bucket) => (
          <Card key={bucket.value}>
            <CardHeader className="gap-1">
              <CardDescription>{bucket.label}</CardDescription>
              <CardTitle
                className={cn(
                  "text-lg font-semibold tabular-nums",
                  bucket.value !== "current" && Object.keys(summary.buckets[bucket.value]).length > 0 && "text-destructive",
                )}
              >
                {formatMoneyTotals(summary.buckets[bucket.value], currency)}
              </CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">Invoice</TableHead>
              <TableHead>Client</TableHead>
              <TableHead className="hidden md:table-cell">Issued</TableHead>
              <TableHead>Due</TableHead>
              <TableHead className="hidden text-right lg:table-cell">Total</TableHead>
              <TableHead className="hidden text-right lg:table-cell">Paid</TableHead>
              <TableHead className="pr-4 text-right">Balance due</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell className="py-3 pl-4">
                  <Link href={`/app/invoices/${invoice.id}`} className="font-medium text-brand hover:underline">
                    {invoice.number}
                  </Link>
                </TableCell>
                <TableCell>{invoice.client.name}</TableCell>
                <TableCell className="hidden md:table-cell">{formatDate(invoice.issueDate)}</TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span>{formatDate(invoice.dueDate)}</span>
                    <span
                      className={cn("text-xs", invoice.daysOverdue > 0 ? "text-destructive" : "text-muted-foreground")}
                    >
                      {overdueLabel(invoice.daysOverdue)}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="hidden text-right tabular-nums lg:table-cell">
                  {formatMoney(invoice.totalCents, invoice.currency)}
                </TableCell>
                <TableCell className="hidden text-right tabular-nums lg:table-cell">
                  {formatMoney(invoice.amountPaidCents, invoice.currency)}
                </TableCell>
                <TableCell className="pr-4 text-right font-medium tabular-nums">
                  {formatMoney(invoice.balanceCents, invoice.currency)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

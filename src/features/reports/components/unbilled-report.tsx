import { Fragment } from "react";
import Link from "next/link";
import { FilePlus2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatMoney } from "@/lib/money";
import { formatDate } from "@/features/time/dates";
import { formatDuration } from "@/features/time/duration";
import { formatMoneyTotals, type MoneyByCurrency } from "../aggregate";
import type { UnbilledClientRow } from "../unbilled";

/** Unbilled time per client and project, with a shortcut to invoice each client. */
export function UnbilledReport({
  clients,
  summary,
  currency,
}: {
  clients: UnbilledClientRow[];
  summary: { minutes: number; amount: MoneyByCurrency };
  currency: string;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="gap-1">
            <CardDescription>Unbilled hours</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums">{formatDuration(summary.minutes)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="gap-1">
            <CardDescription>Estimated amount</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums">
              {formatMoneyTotals(summary.amount, currency)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">Client / project</TableHead>
              <TableHead className="hidden sm:table-cell">Oldest entry</TableHead>
              <TableHead className="text-right">Hours</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="pr-4">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.map((client) => (
              <Fragment key={client.id}>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableCell className="py-3 pl-4 font-medium">{client.name}</TableCell>
                  <TableCell className="hidden sm:table-cell">{formatDate(client.oldestDate)}</TableCell>
                  <TableCell className="text-right font-medium tabular-nums">{formatDuration(client.minutes)}</TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {formatMoney(client.amountCents, client.currency)}
                  </TableCell>
                  <TableCell className="pr-4 text-right">
                    <Link
                      href={`/app/invoices/new?client=${client.id}&source=time`}
                      className={buttonVariants({ size: "sm", variant: "outline" })}
                    >
                      <FilePlus2 aria-hidden />
                      Create invoice
                    </Link>
                  </TableCell>
                </TableRow>
                {client.projects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell className="pl-8 text-muted-foreground">{project.name}</TableCell>
                    <TableCell className="hidden text-muted-foreground sm:table-cell">
                      {formatDate(project.oldestDate)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{formatDuration(project.minutes)}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatMoney(project.amountCents, client.currency)}
                    </TableCell>
                    <TableCell className="pr-4" />
                  </TableRow>
                ))}
              </Fragment>
            ))}
          </TableBody>
        </Table>
      </div>
      <p className="text-xs text-muted-foreground">
        Amounts are estimates from the saved rates; the invoice can differ by a few cents. Running timers aren&apos;t
        included.
      </p>
    </div>
  );
}

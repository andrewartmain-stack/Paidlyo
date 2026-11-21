import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatMoney } from "@/lib/money";
import { formatDate } from "@/features/time/dates";
import type { InvoiceListItem } from "../types";
import { InvoiceStatusBadge } from "./invoice-status-badge";

export function InvoicesTable({ invoices }: { invoices: InvoiceListItem[] }) {
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-4">Invoice</TableHead>
            <TableHead>Client</TableHead>
            <TableHead className="hidden md:table-cell">Issued</TableHead>
            <TableHead className="hidden sm:table-cell">Due</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="pr-4 text-right">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => (
            <TableRow key={invoice.id} className="relative">
              <TableCell className="pl-4 font-medium">
                {/* Stretched link: the whole row opens the invoice. */}
                <Link
                  href={`/app/invoices/${invoice.id}`}
                  className="outline-none after:absolute after:inset-0 hover:underline focus-visible:underline"
                >
                  {invoice.number}
                </Link>
              </TableCell>
              <TableCell>
                <span className="block max-w-56 truncate">{invoice.client.name}</span>
              </TableCell>
              <TableCell className="hidden text-muted-foreground md:table-cell">
                {formatDate(invoice.issueDate)}
              </TableCell>
              <TableCell className="hidden text-muted-foreground sm:table-cell">
                {formatDate(invoice.dueDate)}
              </TableCell>
              <TableCell className="text-right font-medium tabular-nums">
                {formatMoney(invoice.totalCents, invoice.currency)}
              </TableCell>
              <TableCell className="pr-4 text-right">
                <InvoiceStatusBadge status={invoice.displayStatus} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

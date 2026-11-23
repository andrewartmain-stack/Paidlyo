import { FileText } from "lucide-react";
import { usd } from "./format";
import { StatusChip } from "./mock-parts";
import { MockWindow } from "./mock-window";
import { ClientInvoiceActions } from "./client-invoice-actions";
import { buildLines, computeTotals } from "./sample-data";

/** The client's no-login invoice view (/i/[token]). Server-rendered; only the two buttons are a client island. */
export function MockClientInvoice({ className }: { className?: string }) {
  const lines = buildLines("task");
  const totals = computeTotals(lines, 10, 0);

  return (
    <MockWindow
      sidebar={false}
      url="paidlyo.com/i/9fK2xQ"
      className={className}
      description="Preview of the invoice page a client opens from a private link, with the sender's logo, line items, total and buttons to copy the link or download a PDF."
    >
      <div className="mx-auto flex max-w-md flex-col gap-3 rounded-xl border bg-card p-4 text-[11px] shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-foreground text-primary" aria-hidden="true">
              <FileText className="size-4" />
            </span>
            <p className="font-heading text-sm leading-tight font-semibold">
              Northpeak Studio
              <span className="block text-[10px] font-normal text-muted-foreground">hello@northpeak.example</span>
            </p>
          </div>
          <div className="text-right">
            <p className="font-heading text-base font-semibold tracking-tight">INV-0042</p>
            <StatusChip tone="neutral">Sent</StatusChip>
          </div>
        </div>

        <dl className="grid grid-cols-3 gap-2 rounded-lg bg-muted/60 p-2.5">
          <div>
            <dt className="text-[10px] text-muted-foreground">Bill to</dt>
            <dd className="font-medium">Acme Co.</dd>
          </div>
          <div>
            <dt className="text-[10px] text-muted-foreground">Issued</dt>
            <dd className="font-medium">Nov 20, 2026</dd>
          </div>
          <div>
            <dt className="text-[10px] text-muted-foreground">Due</dt>
            <dd className="font-medium">Dec 20, 2026</dd>
          </div>
        </dl>

        <ul>
          {lines.map((l) => (
            <li key={l.id} className="flex items-baseline justify-between gap-3 border-b py-1.5">
              <span className="min-w-0">
                <span className="block truncate">{l.description}</span>
                <span className="text-[10px] text-muted-foreground tabular-nums">{l.hours} h</span>
              </span>
              <span className="font-medium tabular-nums">{usd(l.amountCents)}</span>
            </li>
          ))}
        </ul>

        <dl className="ml-auto flex w-full max-w-48 flex-col gap-1 text-muted-foreground">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd className="tabular-nums">{usd(totals.subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Discount (10%)</dt>
            <dd className="tabular-nums">-{usd(totals.discount)}</dd>
          </div>
          <div className="flex justify-between border-t pt-1.5 text-sm font-semibold text-foreground">
            <dt>Total due</dt>
            <dd className="font-heading tabular-nums">{usd(totals.total)}</dd>
          </div>
        </dl>

        <ClientInvoiceActions />
      </div>
    </MockWindow>
  );
}

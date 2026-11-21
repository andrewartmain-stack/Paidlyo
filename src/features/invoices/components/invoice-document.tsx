import { formatMoney } from "@/lib/money";
import { formatDate } from "@/features/time/dates";
import { balanceDueCents, formatQuantity, formatRate } from "../document";
import type { InvoiceDocumentData, InvoiceSender } from "../types";

/**
 * The invoice as the client sees it. Presentational only, so the preview page and the
 * public client link (item 8b) render the same document. Styled for screen and print.
 */
export function InvoiceDocument({ invoice, sender }: { invoice: InvoiceDocumentData; sender: InvoiceSender }) {
  const money = (cents: number) => formatMoney(cents, invoice.currency);
  const balance = balanceDueCents(invoice.totalCents, invoice.amountPaidCents);

  return (
    <article className="mx-auto flex w-full max-w-[52rem] flex-col gap-10 rounded-xl border bg-card p-6 text-card-foreground shadow-sm sm:p-12 print:max-w-none print:rounded-none print:border-0 print:p-0 print:shadow-none">
      <header className="flex flex-col-reverse justify-between gap-6 sm:flex-row sm:items-start">
        <div className="flex flex-col gap-2">
          {sender.logoUrl ? (
            // Plain <img>: the logo comes from Supabase Storage at its natural size, and it must
            // be in the page before printing (no lazy loading / image optimizer round trip).
            // eslint-disable-next-line @next/next/no-img-element
            <img src={sender.logoUrl} alt={sender.name} className="max-h-16 max-w-48 self-start object-contain" />
          ) : (
            <p className="font-heading text-2xl font-bold tracking-tight">{sender.name}</p>
          )}
          <div className="text-sm text-muted-foreground">
            {sender.logoUrl && <p className="font-medium text-foreground">{sender.name}</p>}
            {sender.address && <p className="whitespace-pre-line">{sender.address}</p>}
          </div>
        </div>
        <div className="flex flex-col gap-1 sm:items-end sm:text-right">
          <h2 className="text-3xl">Invoice</h2>
          <p className="text-sm text-muted-foreground">#{invoice.number}</p>
          {invoice.status === "void" && (
            <p className="mt-1 text-sm font-semibold tracking-wide text-destructive uppercase">Void</p>
          )}
          {invoice.status === "paid" && (
            <p className="mt-1 text-sm font-semibold tracking-wide text-success uppercase">Paid</p>
          )}
        </div>
      </header>

      <section className="grid gap-6 text-sm sm:grid-cols-[1fr_auto]">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Bill to</p>
          <p className="font-medium">{invoice.client.name}</p>
          {invoice.client.address && <p className="whitespace-pre-line text-muted-foreground">{invoice.client.address}</p>}
          {invoice.client.email && <p className="text-muted-foreground">{invoice.client.email}</p>}
        </div>
        <dl className="grid grid-cols-[auto_auto] gap-x-6 gap-y-1 self-start">
          <dt className="text-muted-foreground">Issue date</dt>
          <dd className="text-right">{formatDate(invoice.issueDate)}</dd>
          <dt className="text-muted-foreground">Due date</dt>
          <dd className="text-right">{formatDate(invoice.dueDate)}</dd>
          <dt className="text-muted-foreground">Amount due</dt>
          <dd className="text-right font-semibold">{money(balance)}</dd>
        </dl>
      </section>

      {invoice.subject && (
        <p className="-mb-4 text-sm">
          <span className="text-muted-foreground">Subject: </span>
          {invoice.subject}
        </p>
      )}

      <section>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs tracking-wide text-muted-foreground uppercase">
              <th scope="col" className="py-2 pr-4 font-medium">
                Description
              </th>
              <th scope="col" className="px-2 py-2 text-right font-medium">
                Qty
              </th>
              <th scope="col" className="hidden px-2 py-2 text-right font-medium sm:table-cell print:table-cell">
                Unit price
              </th>
              <th scope="col" className="py-2 pl-2 text-right font-medium">
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item) => (
              <tr key={item.key} className="border-b align-top break-inside-avoid">
                <td className="py-3 pr-4 whitespace-pre-line">{item.description}</td>
                <td className="px-2 py-3 text-right tabular-nums">{formatQuantity(item.quantity)}</td>
                <td className="hidden px-2 py-3 text-right tabular-nums sm:table-cell print:table-cell">
                  {money(item.unitPriceCents)}
                </td>
                <td className="py-3 pl-2 text-right tabular-nums">{money(item.amountCents)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <dl className="mt-6 ml-auto grid max-w-72 grid-cols-[1fr_auto] gap-x-6 gap-y-2 text-sm break-inside-avoid">
          <dt className="text-muted-foreground">Subtotal</dt>
          <dd className="text-right tabular-nums">{money(invoice.subtotalCents)}</dd>
          {invoice.discountCents > 0 && (
            <>
              <dt className="text-muted-foreground">Discount ({formatRate(invoice.discountRate)}%)</dt>
              <dd className="text-right tabular-nums">−{money(invoice.discountCents)}</dd>
            </>
          )}
          {invoice.taxCents > 0 && (
            <>
              <dt className="text-muted-foreground">Tax ({formatRate(invoice.taxRate)}%)</dt>
              <dd className="text-right tabular-nums">{money(invoice.taxCents)}</dd>
            </>
          )}
          <dt className="border-t pt-2 font-medium">Total</dt>
          <dd className="border-t pt-2 text-right font-medium tabular-nums">{money(invoice.totalCents)}</dd>
          {invoice.amountPaidCents > 0 && (
            <>
              <dt className="text-muted-foreground">Paid</dt>
              <dd className="text-right tabular-nums">−{money(invoice.amountPaidCents)}</dd>
            </>
          )}
          <dt className="text-base font-semibold">Amount due</dt>
          <dd className="text-right text-base font-semibold tabular-nums">
            {money(balance)} <span className="text-xs font-normal text-muted-foreground">{invoice.currency}</span>
          </dd>
        </dl>
      </section>

      {invoice.notes && (
        <section className="flex flex-col gap-1 border-t pt-6 text-sm break-inside-avoid">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Notes</p>
          <p className="whitespace-pre-line">{invoice.notes}</p>
        </section>
      )}
    </article>
  );
}

"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { usd } from "./format";
import { buildLines, computeTotals, type GroupBy } from "./sample-data";
import { MockWindow } from "./mock-window";

const OPTIONS: { value: GroupBy; title: string; hint: string }[] = [
  { value: "task", title: "By task", hint: "One line per task." },
  { value: "project", title: "By project", hint: "One line per project." },
  { value: "entry", title: "Each entry", hint: "One line per entry." },
];

function clampPercent(value: string) {
  return Math.min(100, Math.max(0, Math.round(Number(value) || 0)));
}

const percentInput =
  "h-6 w-12 rounded-md border bg-background px-1.5 text-right text-[11px] tabular-nums outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30";

export function MockInvoiceBuilder({ sidebar = true, className }: { sidebar?: boolean; className?: string }) {
  const [groupBy, setGroupBy] = useState<GroupBy>("task");
  const [discount, setDiscount] = useState("10");
  const [tax, setTax] = useState("0");

  const lines = buildLines(groupBy);
  const totals = computeTotals(lines, clampPercent(discount), clampPercent(tax));

  return (
    <MockWindow
      active="Invoices"
      sidebar={sidebar}
      className={className}
      description="Interactive preview of the Paidlyo invoice builder. Choose how unbilled time is grouped into lines and change the discount and tax to see the totals update."
    >
      <div className="flex flex-col gap-3">
        <div>
          <p className="font-heading text-base font-semibold tracking-tight">New invoice</p>
          <p className="text-[11px] text-muted-foreground">Acme Co. (USD) &middot; 51:00 unbilled &middot; Net 30, due Dec 20, 2026</p>
        </div>

        <fieldset>
          <legend className="mb-1.5 text-[11px] font-medium">Group time into lines</legend>
          <div className="grid grid-cols-3 gap-1.5">
            {OPTIONS.map((o) => (
              <label
                key={o.value}
                className={cn(
                  "flex cursor-pointer items-start gap-1.5 rounded-lg border p-2 transition-colors has-focus-visible:ring-3 has-focus-visible:ring-ring/50",
                  groupBy === o.value ? "border-brand/40 bg-accent" : "hover:bg-muted/60",
                )}
              >
                <input type="radio" name="mock-group-by" value={o.value} checked={groupBy === o.value} onChange={() => setGroupBy(o.value)} className="sr-only" />
                <span
                  aria-hidden="true"
                  className={cn("mt-0.5 flex size-3 shrink-0 items-center justify-center rounded-full border", groupBy === o.value ? "border-brand" : "border-input")}
                >
                  {groupBy === o.value && <span className="size-1.5 rounded-full bg-brand" />}
                </span>
                <span className="text-[11px] leading-tight font-medium">
                  {o.title}
                  <span className="mt-0.5 hidden text-[10px] font-normal text-muted-foreground @md:block">{o.hint}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="overflow-hidden rounded-xl border text-[11px]">
          <div className="flex items-center justify-between border-b bg-muted/40 px-3 py-1.5 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              Draft &middot; Acme Co. <ChevronDown className="size-3" aria-hidden />
            </span>
            <span>{lines.length} lines</span>
          </div>
          <ul>
            {lines.map((l) => (
              <li key={l.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 border-b px-3 py-1.5 transition-colors hover:bg-muted/40">
                <span className="truncate">{l.description}</span>
                <span className="font-medium tabular-nums">{usd(l.amountCents)}</span>
                <span className="text-[10px] text-muted-foreground tabular-nums">
                  {l.hours} h &times; {usd(l.rateCents)}
                </span>
              </li>
            ))}
          </ul>
          <dl className="ml-auto flex w-full max-w-60 flex-col gap-1.5 px-3 py-2.5">
            <div className="flex justify-between text-muted-foreground">
              <dt>Subtotal</dt>
              <dd className="tabular-nums">{usd(totals.subtotal)}</dd>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <dt>
                <label className="flex items-center gap-1.5">
                  Discount
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={100}
                    step={1}
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    className={percentInput}
                  />
                  %
                </label>
              </dt>
              <dd className="tabular-nums">-{usd(totals.discount)}</dd>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <dt>
                <label className="flex items-center gap-1.5">
                  Tax
                  <input type="number" inputMode="numeric" min={0} max={100} step={1} value={tax} onChange={(e) => setTax(e.target.value)} className={cn(percentInput, "ml-[1.125rem]")} />
                  %
                </label>
              </dt>
              <dd className="tabular-nums">{usd(totals.tax)}</dd>
            </div>
            <div className="flex justify-between border-t pt-1.5 text-sm font-semibold text-foreground">
              <dt>Total</dt>
              <dd className="font-heading tabular-nums" aria-live="polite">
                {usd(totals.total)}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </MockWindow>
  );
}

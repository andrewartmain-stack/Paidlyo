"use client";

import { Plus, RotateCcw } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { usd } from "./format";
import { mockButton, mockButtonPrimary, StatusChip } from "./mock-parts";
import { MockWindow } from "./mock-window";

const TOTAL = 727000;
/** Scripted payments the button records one by one. They add up to TOTAL. */
const PAYMENTS = [
  { date: "Nov 20, 2026", method: "Bank transfer", cents: 300000 },
  { date: "Nov 27, 2026", method: "Card", cents: 250000 },
  { date: "Dec 4, 2026", method: "PayPal", cents: 177000 },
];

export function MockPayments({ sidebar = true, className }: { sidebar?: boolean; className?: string }) {
  const [count, setCount] = useState(0);
  const recorded = PAYMENTS.slice(0, count);
  const paid = recorded.reduce((sum, p) => sum + p.cents, 0);
  const balance = TOTAL - paid;
  const status = balance === 0 ? { tone: "success", label: "Paid" } : paid > 0 ? { tone: "warning", label: "Partially paid" } : { tone: "neutral", label: "Sent" };
  const next = PAYMENTS[count];

  return (
    <MockWindow
      active="Invoices"
      sidebar={sidebar}
      className={className}
      description="Interactive preview of recording payments on a Paidlyo invoice. Each click on Record payment adds a payment, and the status changes from Sent to Partially paid to Paid."
    >
      <div className="flex flex-col gap-3 text-[11px]">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-heading text-base font-semibold tracking-tight">INV-0043</p>
            <p className="text-muted-foreground">Acme Co. &middot; Due Dec 20, 2026</p>
          </div>
          <span aria-live="polite">
            <StatusChip tone={status.tone as "success" | "warning" | "neutral"} className="h-6 px-2.5 text-[11px]">
              {status.label}
            </StatusChip>
          </span>
        </div>

        <div className="rounded-xl border p-3">
          <div className="grid grid-cols-3 gap-2">
            <div>
              <p className="text-muted-foreground">Total</p>
              <p className="font-heading text-sm font-semibold tabular-nums">{usd(TOTAL)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Paid</p>
              <p className="font-heading text-sm font-semibold tabular-nums">{usd(paid)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Balance due</p>
              <p className={cn("font-heading text-sm font-semibold tabular-nums", balance === 0 && "text-success")}>{usd(balance)}</p>
            </div>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden="true">
            <div className="h-full rounded-full bg-primary motion-safe:transition-[width] motion-safe:duration-500" style={{ width: `${Math.round((paid / TOTAL) * 100)}%` }} />
          </div>
        </div>

        <div className="rounded-xl border">
          <div className="flex items-center justify-between gap-2 border-b px-3 py-2">
            <div>
              <p className="font-heading text-[13px] font-semibold">Payments</p>
              <p className="text-muted-foreground">{balance === 0 ? "Paid in full." : paid > 0 ? `${usd(balance)} still due.` : "No payments recorded yet."}</p>
            </div>
            <div className="flex gap-1.5">
              {count > 0 && (
                <button type="button" onClick={() => setCount(0)} className={mockButton}>
                  <RotateCcw className="size-3" aria-hidden />
                  Start over
                </button>
              )}
              <button type="button" disabled={!next} onClick={() => setCount((c) => c + 1)} className={mockButtonPrimary}>
                <Plus className="size-3" aria-hidden />
                {next ? "Record payment" : "Paid in full"}
              </button>
            </div>
          </div>
          <ul aria-live="polite">
            {recorded.map((p) => (
              <li key={p.date} className="flex items-center justify-between gap-3 border-b px-3 py-2 transition-colors hover:bg-muted/40">
                <span>{p.date}</span>
                <span className="flex-1 text-muted-foreground">{p.method}</span>
                <span className="font-medium tabular-nums">{usd(p.cents)}</span>
              </li>
            ))}
            {recorded.length === 0 && <li className="px-3 py-4 text-center text-muted-foreground">Record a payment to see the balance change.</li>}
          </ul>
          <div className="flex justify-between px-3 py-2 font-semibold">
            <span>Total paid</span>
            <span className="tabular-nums">{usd(paid)}</span>
          </div>
        </div>
      </div>
    </MockWindow>
  );
}

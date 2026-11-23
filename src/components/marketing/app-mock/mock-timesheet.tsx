"use client";

import { Clock, Play, Square } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { clock, clockSeconds } from "./format";
import { mockButton, StatusChip } from "./mock-parts";
import { MockWindow } from "./mock-window";
import { useInView } from "./use-in-view";

type Row = { id: string; project: string; client: string; task: string; billable: boolean; earlier: number[]; today: number };

/** Minutes for Mon-Thu plus today's (Friday) minutes. */
const ROWS: Row[] = [
  { id: "a", project: "Brand refresh", client: "Acme Co.", task: "Design review", billable: true, earlier: [150, 120, 90, 140], today: 84 },
  { id: "b", project: "Website redesign", client: "Brightline", task: "Frontend build", billable: true, earlier: [180, 200, 150, 120], today: 65 },
  { id: "c", project: "Internal", client: "Northpeak Studio", task: "Planning", billable: false, earlier: [30, 40, 30, 38], today: 32 },
  { id: "d", project: "Brand refresh", client: "Acme Co.", task: "Moodboards", billable: true, earlier: [60, 60, 60, 60], today: 50 },
  { id: "e", project: "Q4 retainer", client: "Halden & Co.", task: "Client call", billable: true, earlier: [30, 60, 60, 80], today: 45 },
];

const DAYS = [
  ["Mon", "16"],
  ["Tue", "17"],
  ["Wed", "18"],
  ["Thu", "19"],
  ["Fri", "20"],
  ["Sat", "21"],
  ["Sun", "22"],
] as const;

export function MockTimesheet({ sidebar = true, className }: { sidebar?: boolean; className?: string }) {
  const [view, setView] = useState<"day" | "week">("day");
  const [seconds, setSeconds] = useState<Record<string, number>>(() => Object.fromEntries(ROWS.map((r) => [r.id, r.today * 60])));
  const [running, setRunning] = useState<string | null>(null);
  const [ref, inView] = useInView<HTMLDivElement>();

  useEffect(() => {
    if (!running || !inView) return;
    const id = setInterval(() => setSeconds((s) => ({ ...s, [running]: s[running] + 1 })), 1000);
    return () => clearInterval(id);
  }, [running, inView]);

  const todayTotal = ROWS.reduce((sum, r) => sum + seconds[r.id], 0);
  const earlierTotals = [0, 1, 2, 3].map((d) => ROWS.reduce((sum, r) => sum + r.earlier[d] * 60, 0));
  const weekTotal = earlierTotals.reduce((a, b) => a + b, 0) + todayTotal;
  const dayTotals = [...earlierTotals, todayTotal, 0, 0];

  return (
    <MockWindow
      active="Timesheet"
      sidebar={sidebar}
      className={className}
      description="Interactive preview of the Paidlyo timesheet. Switch between day and week views and start or stop a timer on any row."
    >
      <div ref={ref} className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-xl bg-accent text-brand" aria-hidden="true">
              <Clock className="size-3.5" />
            </span>
            <p className="font-heading text-base font-semibold tracking-tight">{view === "day" ? "Today: Friday, Nov 20" : "Nov 16 - 22"}</p>
          </div>
          <div role="group" aria-label="Timesheet view" className="flex rounded-full bg-muted p-0.5 text-[11px]">
            {(["day", "week"] as const).map((v) => (
              <button
                key={v}
                type="button"
                aria-pressed={view === v}
                onClick={() => setView(v)}
                className={cn(
                  "h-6 rounded-full px-3 font-medium capitalize outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50",
                  view === v ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-1 @lg:grid-cols-8" aria-hidden="true">
          {DAYS.map(([d, n], i) => (
            <div key={d} className={cn("rounded-lg border border-transparent px-1.5 py-1 text-[10px] whitespace-nowrap text-muted-foreground", i === 4 && "border-border bg-background text-foreground")}>
              {d} {n}
              <span className="block text-[11px] font-semibold text-foreground tabular-nums">{clock(dayTotals[i])}</span>
            </div>
          ))}
          <div className="rounded-lg px-1.5 py-1 text-[10px] text-muted-foreground">
            Total
            <span className="block text-[11px] font-semibold text-foreground tabular-nums">{clock(weekTotal)}</span>
          </div>
        </div>

        {view === "day" ? (
          <ul className="overflow-hidden rounded-xl border">
            {ROWS.map((r) => {
              const on = running === r.id;
              return (
                <li key={r.id} className={cn("flex items-center gap-2 border-b px-3 py-2 transition-colors", on ? "bg-accent/60" : "hover:bg-muted/50")}>
                  <p className="min-w-0 flex-1 text-[11px] leading-snug">
                    <span className="font-semibold">{r.project}</span> <span className="text-muted-foreground">({r.client})</span>
                    <span className="flex items-center gap-1.5">
                      {r.task}
                      {!r.billable && <StatusChip tone="neutral">Non-billable</StatusChip>}
                    </span>
                  </p>
                  <span className={cn("font-heading text-sm font-semibold tabular-nums", on && "text-brand")}>
                    {on ? clockSeconds(seconds[r.id]) : clock(seconds[r.id])}
                  </span>
                  <button
                    type="button"
                    onClick={() => setRunning(on ? null : r.id)}
                    aria-label={`${on ? "Stop" : "Start"} timer for ${r.project}, ${r.task}`}
                    className={cn(mockButton, "w-[4.25rem]", on && "border-foreground bg-foreground text-background hover:bg-foreground/90")}
                  >
                    {on ? <Square className="size-3 fill-current" aria-hidden /> : <Play className="size-3" aria-hidden />}
                    {on ? "Stop" : "Start"}
                  </button>
                </li>
              );
            })}
            <li className="flex items-center justify-between bg-muted/40 px-3 py-2 text-[11px] text-muted-foreground">
              Total
              <span className="font-heading text-sm font-semibold text-foreground tabular-nums">{clock(todayTotal)}</span>
            </li>
          </ul>
        ) : (
          <div className="overflow-hidden rounded-xl border text-[10px]">
            <div className="grid grid-cols-[minmax(0,1.8fr)_repeat(7,minmax(0,1fr))] border-b bg-muted/40 px-3 py-1.5 text-muted-foreground">
              <span>Project</span>
              {DAYS.map(([d]) => (
                <span key={d} className="text-right">
                  {d}
                </span>
              ))}
            </div>
            {ROWS.map((r) => {
              const cells = [...r.earlier.map((m) => m * 60), seconds[r.id], 0, 0];
              return (
                <div key={r.id} className="grid grid-cols-[minmax(0,1.8fr)_repeat(7,minmax(0,1fr))] items-center border-b px-3 py-2 hover:bg-muted/50">
                  <span className="truncate pr-1 text-[11px]">
                    <span className="font-semibold">{r.project}</span>
                    <span className="block truncate text-muted-foreground">{r.task}</span>
                  </span>
                  {cells.map((s, i) => (
                    <span key={i} className={cn("text-right tabular-nums", s === 0 && "text-faint-foreground", i === 4 && "font-semibold text-brand")}>
                      {s === 0 ? "-" : clock(s)}
                    </span>
                  ))}
                </div>
              );
            })}
            <div className="grid grid-cols-[minmax(0,1.8fr)_repeat(7,minmax(0,1fr))] bg-muted/40 px-3 py-2 font-semibold">
              <span className="text-[11px] font-normal text-muted-foreground">Total</span>
              {dayTotals.map((s, i) => (
                <span key={i} className="text-right tabular-nums">
                  {clock(s)}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </MockWindow>
  );
}

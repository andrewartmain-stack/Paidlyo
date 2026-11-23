"use client";

import { Download, BarChart3 } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { StatCard } from "./mock-parts";
import { MockWindow } from "./mock-window";

type Group = "Clients" | "Projects" | "Tasks";
type Row = { name: string; share: number; hours: string; billable: string; amount: string };

const DATA: Record<Group, Row[]> = {
  Clients: [
    { name: "Acme Co.", share: 33, hours: "55:04", billable: "48:00", amount: "$6,842.43" },
    { name: "Brightline", share: 19, hours: "39:46", billable: "37:39", amount: "$5,270.64" },
    { name: "Halden & Co.", share: 8, hours: "25:11", billable: "22:49", amount: "$3,195.33" },
    { name: "Northwind", share: 4, hours: "14:07", billable: "8:28", amount: "$1,482.37" },
  ],
  Projects: [
    { name: "Brand refresh", share: 28, hours: "42:30", billable: "40:10", amount: "$5,624.00" },
    { name: "Website redesign", share: 24, hours: "37:15", billable: "36:00", amount: "$4,320.00" },
    { name: "Q4 retainer", share: 12, hours: "21:40", billable: "21:40", amount: "$3,250.00" },
    { name: "Internal", share: 6, hours: "18:15", billable: "0:00", amount: "$0.00" },
  ],
  Tasks: [
    { name: "Design review", share: 22, hours: "30:20", billable: "30:20", amount: "$4,248.00" },
    { name: "Frontend build", share: 20, hours: "28:45", billable: "28:45", amount: "$3,450.00" },
    { name: "Client call", share: 9, hours: "12:10", billable: "12:10", amount: "$1,825.00" },
    { name: "Planning", share: 7, hours: "10:30", billable: "2:15", amount: "$270.00" },
  ],
};

export function MockReports({ sidebar = true, className }: { sidebar?: boolean; className?: string }) {
  const [group, setGroup] = useState<Group>("Clients");
  const rows = DATA[group];
  const max = Math.max(...rows.map((r) => r.share));

  return (
    <MockWindow
      active="Reports"
      sidebar={sidebar}
      className={className}
      description="Interactive preview of Paidlyo reports with totals for the month and a table you can switch between clients, projects and tasks."
    >
      <div className="flex flex-col gap-3 text-[11px]">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-xl bg-accent text-brand" aria-hidden="true">
              <BarChart3 className="size-3.5" />
            </span>
            <p className="font-heading text-base leading-tight font-semibold tracking-tight">
              Reports
              <span className="block text-[10px] font-normal tracking-normal text-muted-foreground">Time tracked Nov 1 - 30, 2026</span>
            </p>
          </div>
          <span aria-hidden="true" className="inline-flex h-7 items-center gap-1.5 rounded-full border px-3 font-medium">
            <Download className="size-3" /> Export CSV
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 @lg:grid-cols-4">
          <StatCard label="Total hours" value="134:07" hint="18:15 non-billable" />
          <StatCard label="Billable hours" value="116:57" hint="87% of total" />
          <StatCard label="Billable amount" value="$16,790.77" hint="Hours x rates" />
          <StatCard label="Unbilled amount" value="$1,844.73" hint="Not on an invoice" />
        </div>

        <div role="group" aria-label="Group report by" className="flex w-fit rounded-full bg-muted p-0.5">
          {(Object.keys(DATA) as Group[]).map((g) => (
            <button
              key={g}
              type="button"
              aria-pressed={group === g}
              onClick={() => setGroup(g)}
              className={cn(
                "h-6 rounded-full px-3 font-medium outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50",
                group === g ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {g}
            </button>
          ))}
        </div>

        <div className="overflow-hidden rounded-xl border">
          <div className="grid grid-cols-[minmax(0,1fr)_3rem_3rem_4.5rem] gap-x-2 border-b bg-muted/40 px-3 py-1.5 text-[10px] text-muted-foreground @md:grid-cols-[minmax(0,1fr)_4rem_4rem_5.5rem]">
            <span>{group.slice(0, -1)}</span>
            <span className="text-right">Hours</span>
            <span className="text-right">Billable</span>
            <span className="text-right">Amount</span>
          </div>
          {rows.map((r) => (
            <div
              key={`${group}-${r.name}`}
              className="grid grid-cols-[minmax(0,1fr)_3rem_3rem_4.5rem] items-center gap-x-2 border-b px-3 py-2 tabular-nums transition-colors last:border-b-0 hover:bg-muted/40 @md:grid-cols-[minmax(0,1fr)_4rem_4rem_5.5rem]"
            >
              <span className="min-w-0">
                <span className="block truncate font-semibold">{r.name}</span>
                <span className="mt-1 flex items-center gap-1.5">
                  <span className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
                    <span
                      className="block h-full w-(--w) rounded-full bg-brand motion-safe:transition-[width] motion-safe:duration-700 motion-safe:starting:w-0"
                      style={{ "--w": `${Math.round((r.share / max) * 100)}%` } as React.CSSProperties}
                    />
                  </span>
                  <span className="w-7 text-[10px] text-muted-foreground">{r.share}%</span>
                </span>
              </span>
              <span className="text-right">{r.hours}</span>
              <span className="text-right">{r.billable}</span>
              <span className="text-right font-medium">{r.amount}</span>
            </div>
          ))}
        </div>
      </div>
    </MockWindow>
  );
}

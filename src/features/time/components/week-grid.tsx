"use client";

import { useState, useTransition, type FocusEvent, type KeyboardEvent } from "react";
import Link from "next/link";
import { Check, Lock, Timer } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { setWeekCell } from "../actions";
import { formatShortDate, formatWeekday } from "../dates";
import { formatDuration, parseDuration } from "../duration";
import type { TrackableProject } from "../types";
import { emptyCell, rowKey, type WeekCell, type WeekRow } from "../week";
import { AddRowDialog } from "./add-row-dialog";
import { timesheetHref } from "./week-strip";

export function WeekGrid({
  rows,
  days,
  today,
  projects,
}: {
  rows: WeekRow[];
  days: string[];
  today: string;
  projects: TrackableProject[];
}) {
  // Rows added with "Add row" that have no time yet (they disappear once saved time arrives
  // from the server as a real row).
  const [extraRows, setExtraRows] = useState<WeekRow[]>([]);
  const serverKeys = new Set(rows.map((r) => r.key));
  const allRows = [...rows, ...extraRows.filter((r) => !serverKeys.has(r.key))];

  const dayTotals = days.map((day) => allRows.reduce((sum, row) => sum + row.cells[day].minutes, 0));
  const weekTotal = dayTotals.reduce((a, b) => a + b, 0);

  function addRow(project: TrackableProject, task: { id: string; name: string }) {
    const key = rowKey(project.id, task.id);
    if (allRows.some((r) => r.key === key)) {
      toast.info("That row is already in this week.");
      return;
    }
    setExtraRows((current) => [
      ...current,
      {
        key,
        project: { id: project.id, name: project.name, code: project.code, clientName: project.clientName },
        task,
        cells: Object.fromEntries(days.map((d) => [d, emptyCell()])),
        total: 0,
      },
    ]);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-x-auto rounded-xl bg-card ring-1 ring-border">
        <table className="w-full min-w-[56rem] border-collapse text-sm">
          <thead>
            <tr className="border-b text-left">
              <th scope="col" className="px-4 py-3 font-medium text-muted-foreground">
                Project / Task
              </th>
              {days.map((day) => (
                <th
                  key={day}
                  scope="col"
                  className={cn("w-24 px-2 py-3 text-center font-medium", day === today && "bg-accent")}
                >
                  <Link
                    href={timesheetHref(day, today)}
                    className="flex flex-col rounded-sm outline-none hover:text-brand focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className={cn(day === today ? "text-brand" : "text-foreground")}>
                      {formatWeekday(day)}
                    </span>
                    <span className="text-xs font-normal text-muted-foreground">{formatShortDate(day)}</span>
                  </Link>
                </th>
              ))}
              <th scope="col" className="w-24 px-4 py-3 text-right font-medium text-muted-foreground">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {allRows.length === 0 && (
              <tr>
                <td colSpan={days.length + 2} className="px-4 py-12 text-center text-muted-foreground">
                  No time this week. Use <span className="font-medium text-foreground">Add row</span> to
                  start filling in your week.
                </td>
              </tr>
            )}
            {allRows.map((row) => (
              <tr key={row.key} className="border-b">
                <th scope="row" className="max-w-72 px-4 py-2 text-left font-normal">
                  <span className="block truncate">
                    <span className="font-semibold">{row.project.name}</span>
                    <span className="text-muted-foreground"> ({row.project.clientName})</span>
                  </span>
                  <span className="block truncate text-muted-foreground">{row.task.name}</span>
                </th>
                {days.map((day) => (
                  <td key={day} className={cn("px-2 py-2", day === today && "bg-accent/50")}>
                    <GridCell
                      // Remount when the saved value changes so the input shows it.
                      key={`${row.key}:${day}:${row.cells[day].minutes}:${row.cells[day].entryCount}`}
                      row={row}
                      day={day}
                      cell={row.cells[day]}
                      dayHref={timesheetHref(day, today)}
                    />
                  </td>
                ))}
                <td className="px-4 py-2 text-right font-medium tabular-nums">
                  {formatDuration(days.reduce((sum, d) => sum + row.cells[d].minutes, 0))}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-muted/50">
              <th scope="row" className="px-4 py-3 text-left font-medium text-muted-foreground">
                Total
              </th>
              {dayTotals.map((total, i) => (
                <td key={days[i]} className="px-2 py-3 text-center font-medium tabular-nums">
                  {formatDuration(total)}
                </td>
              ))}
              <td className="px-4 py-3 text-right font-heading text-base font-semibold tabular-nums">
                {formatDuration(weekTotal)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
      <div>
        <AddRowDialog projects={projects} onAdd={addRow} />
      </div>
    </div>
  );
}

type CellStatus = "idle" | "saving" | "saved" | "error";

function GridCell({
  row,
  day,
  cell,
  dayHref,
}: {
  row: WeekRow;
  day: string;
  cell: WeekCell;
  dayHref: string;
}) {
  const initial = cell.minutes > 0 || cell.entryCount > 0 ? formatDuration(cell.minutes) : "";
  const [status, setStatus] = useState<CellStatus>("idle");
  const [, startTransition] = useTransition();
  const label = `${row.project.name} – ${row.task.name}, ${formatWeekday(day)} ${formatShortDate(day)}`;

  if (!cell.editable) {
    return (
      <Link
        href={dayHref}
        title={
          cell.invoiced
            ? "This time is on an invoice"
            : cell.running
              ? "Timer running — open the day to stop it"
              : "Several entries — edit them in the day view"
        }
        aria-label={`${label}: ${formatDuration(cell.minutes)}, open day view`}
        className="flex h-9 items-center justify-center gap-1 rounded-lg border border-dashed text-center tabular-nums text-muted-foreground outline-none hover:border-input hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
      >
        {cell.invoiced && <Lock aria-hidden className="size-3.5" />}
        {cell.running && <Timer aria-hidden className="size-3.5 text-brand" />}
        {formatDuration(cell.minutes)}
      </Link>
    );
  }

  function save(event: FocusEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const text = input.value.trim();
    if (text === initial) return;
    if (text !== "" && parseDuration(text) === null) {
      setStatus("error");
      toast.error("Enter a duration like 1:30 or 1.5.");
      return;
    }
    setStatus("saving");
    startTransition(async () => {
      const result = await setWeekCell({ projectId: row.project.id, taskId: row.task.id, date: day, duration: text });
      if (result.ok) {
        setStatus("saved");
      } else {
        setStatus("error");
        toast.error(result.error);
      }
    });
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") event.currentTarget.blur();
    if (event.key === "Escape") {
      event.currentTarget.value = initial;
      setStatus("idle");
      event.currentTarget.blur();
    }
  }

  return (
    <div className="relative">
      <input
        aria-label={label}
        aria-invalid={status === "error" ? true : undefined}
        defaultValue={initial}
        placeholder="0:00"
        inputMode="decimal"
        autoComplete="off"
        disabled={status === "saving"}
        onBlur={save}
        onKeyDown={onKeyDown}
        onChange={() => status !== "idle" && setStatus("idle")}
        className="h-9 w-full rounded-lg border border-input bg-card px-2 text-center tabular-nums outline-none transition-colors placeholder:text-faint-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60 aria-invalid:border-destructive"
      />
      {status === "saved" && (
        <Check aria-label="Saved" className="pointer-events-none absolute top-1/2 right-1.5 size-3.5 -translate-y-1/2 text-success" />
      )}
    </div>
  );
}

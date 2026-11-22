"use client";

import { useState, useTransition } from "react";
import { Lock, Pencil, Play, Square } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { startTimer, stopTimer } from "../actions";
import type { TimeEntry, TrackableProject } from "../types";
import { LiveDuration } from "./live-duration";
import { TimeEntryDialog } from "./time-entry-dialog";

export function TimeEntryList({
  entries,
  projects,
  date,
  dateLabel,
  isToday,
  serverNowMs,
  locked = false,
}: {
  entries: TimeEntry[];
  projects: TrackableProject[];
  date: string;
  dateLabel: string;
  isToday: boolean;
  serverNowMs: number;
  /** Week submitted or approved: no timers or edits. */
  locked?: boolean;
}) {
  const [editing, setEditing] = useState<TimeEntry | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function toggleTimer(entry: TimeEntry) {
    setPendingId(entry.id);
    startTransition(async () => {
      const result = entry.timerStartedAt ? await stopTimer(entry.id) : await startTimer(entry.id);
      setPendingId(null);
      if (!result.ok) toast.error(result.error);
    });
  }

  return (
    <>
      <ul className="divide-y">
        {entries.map((entry) => {
          const running = entry.timerStartedAt !== null;
          return (
            <li
              key={entry.id}
              className={cn("flex items-start gap-4 px-4 py-3 sm:px-5", running && "bg-accent/60")}
            >
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <p className="text-sm">
                  <span className="font-semibold">{entry.project.name}</span>
                  <span className="text-muted-foreground"> ({entry.project.clientName})</span>
                </p>
                <p className="flex items-center gap-2 text-sm">
                  {entry.task.name}
                  {!entry.isBillable && <Badge variant="secondary">Non-billable</Badge>}
                  {entry.invoiced && (
                    <Badge variant="outline">
                      <Lock aria-hidden />
                      Invoiced
                    </Badge>
                  )}
                </p>
                {entry.notes && (
                  <p className="text-sm whitespace-pre-line text-muted-foreground">{entry.notes}</p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <LiveDuration
                  minutes={entry.minutes}
                  timerStartedAt={entry.timerStartedAt}
                  serverNowMs={serverNowMs}
                  className="min-w-14 text-right font-heading text-lg font-semibold tabular-nums"
                />
                {(isToday || running) && !entry.invoiced && !locked && (
                  <Button
                    variant={running ? "default" : "outline"}
                    size="sm"
                    disabled={pendingId === entry.id}
                    onClick={() => toggleTimer(entry)}
                    className="w-20"
                  >
                    {running ? <Square aria-hidden /> : <Play aria-hidden />}
                    {running ? "Stop" : "Start"}
                  </Button>
                )}
                {!locked && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Edit ${entry.project.name} – ${entry.task.name}`}
                  disabled={entry.invoiced}
                  title={entry.invoiced ? "This time is on an invoice" : undefined}
                  onClick={() => setEditing(entry)}
                >
                  <Pencil aria-hidden />
                </Button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      <TimeEntryDialog
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
        projects={projects}
        date={date}
        dateLabel={dateLabel}
        isToday={isToday}
        entry={editing ?? undefined}
      />
    </>
  );
}

"use client";

import { useState, useTransition } from "react";
import { Check, ChevronDown, RotateCcw, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatDuration } from "@/features/time/duration";
import { reviewWeek } from "../actions";
import { reviewActions, type ReviewAction } from "../rules";
import type { SubmissionRow } from "../types";

const ACTION_COPY: Record<Exclude<ReviewAction, "approve">, { title: string; button: string; hint: string }> = {
  reject: {
    title: "Send this week back",
    button: "Reject week",
    hint: "The week unlocks so they can fix it. They'll see your note on their timesheet.",
  },
  reopen: {
    title: "Reopen this approved week",
    button: "Reopen week",
    hint: "The week unlocks so it can be changed, then submitted again.",
  },
};

/** Submitted / decided weeks with hour totals, an expandable breakdown, and review buttons. */
export function ApprovalsTable({
  rows,
  weekLabels,
  decidedLabels,
}: {
  rows: SubmissionRow[];
  /** "17 – 23 Nov 2026" by submission id (formatted on the server). */
  weekLabels: Record<string, string>;
  /** "Andrei on 24 Nov" by submission id. */
  decidedLabels: Record<string, string>;
}) {
  const [pending, startTransition] = useTransition();
  const [dialog, setDialog] = useState<{ row: SubmissionRow; action: Exclude<ReviewAction, "approve"> } | null>(null);

  function approve(row: SubmissionRow) {
    startTransition(async () => {
      const result = await reviewWeek({ id: row.id, action: "approve", note: "" });
      if (result.ok) toast.success(`Approved ${row.personName}'s week`);
      else toast.error(result.error);
    });
  }

  return (
    <>
      <ul className="divide-y overflow-hidden rounded-xl border bg-card">
        {rows.map((row) => {
          const actions = reviewActions(row.status);
          return (
            <li key={row.id}>
              <details className="group">
                <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 hover:bg-muted/50 [&::-webkit-details-marker]:hidden">
                  <ChevronDown
                    className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
                    aria-hidden
                  />
                  <span className="min-w-40 flex-1">
                    <span className="block font-medium">{row.personName}</span>
                    <span className="block text-xs text-muted-foreground">{weekLabels[row.id]}</span>
                  </span>
                  <span className="text-sm tabular-nums">
                    <span className="font-semibold">{formatDuration(row.summary.minutes)}</span>
                    <span className="text-muted-foreground"> · {formatDuration(row.summary.billableMinutes)} billable</span>
                  </span>
                  {actions.length > 0 && (
                    <span className="flex gap-2" onClick={(event) => event.preventDefault()}>
                      {actions.includes("approve") && (
                        <Button size="sm" onClick={() => approve(row)} disabled={pending}>
                          <Check aria-hidden />
                          Approve
                        </Button>
                      )}
                      {actions.includes("reject") && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setDialog({ row, action: "reject" })}
                          disabled={pending}
                        >
                          <X aria-hidden />
                          Reject
                        </Button>
                      )}
                      {actions.includes("reopen") && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setDialog({ row, action: "reopen" })}
                          disabled={pending}
                        >
                          <RotateCcw aria-hidden />
                          Reopen
                        </Button>
                      )}
                    </span>
                  )}
                </summary>
                <div className="flex flex-col gap-2 border-t bg-muted/30 px-4 py-3 pl-12 text-sm">
                  {decidedLabels[row.id] && (
                    <p className="text-muted-foreground">
                      {row.status === "approved" ? "Approved" : "Sent back"} by {decidedLabels[row.id]}
                      {row.note ? <> · &ldquo;{row.note}&rdquo;</> : null}
                    </p>
                  )}
                  {row.summary.lines.length === 0 ? (
                    <p className="text-muted-foreground">No time this week.</p>
                  ) : (
                    <ul className="flex flex-col gap-1">
                      {row.summary.lines.map((line) => (
                        <li key={line.label} className="flex justify-between gap-4">
                          <span className="truncate">{line.label}</span>
                          <span className="tabular-nums">{formatDuration(line.minutes)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </details>
            </li>
          );
        })}
      </ul>
      <ReviewDialog state={dialog} onClose={() => setDialog(null)} />
    </>
  );
}

function ReviewDialog({
  state,
  onClose,
}: {
  state: { row: SubmissionRow; action: Exclude<ReviewAction, "approve"> } | null;
  onClose: () => void;
}) {
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();
  const copy = state ? ACTION_COPY[state.action] : null;

  function confirm() {
    if (!state) return;
    startTransition(async () => {
      const result = await reviewWeek({ id: state.row.id, action: state.action, note });
      if (result.ok) {
        toast.success(state.action === "reject" ? "Week sent back" : "Week reopened");
        setNote("");
        onClose();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Dialog open={state !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="gap-6 p-6 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg">{copy?.title}</DialogTitle>
          <DialogDescription>{copy?.hint}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Label htmlFor="review-note">Note for {state?.row.personName ?? "them"} (optional)</Label>
          <Textarea
            id="review-note"
            rows={3}
            maxLength={1000}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="e.g. Please split the meeting time by project."
          />
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" type="button" />}>Cancel</DialogClose>
          <Button type="button" variant="destructive" onClick={confirm} disabled={pending}>
            {pending ? "Saving…" : copy?.button}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useTransition } from "react";
import { CheckCircle2, Clock3, Send, Undo2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { submitWeek, withdrawWeek } from "../actions";
import type { TimesheetStatus } from "../rules";

/**
 * Timesheet: the week's approval status with Submit / Withdraw. Shown only when approvals are on.
 * `decidedLabel` is "Andrei on 24 Nov 2026" (formatted on the server).
 */
export function WeekApproval({
  week,
  weekLabel,
  status,
  note,
  decidedLabel,
  hasTime,
}: {
  week: string;
  weekLabel: string;
  status: TimesheetStatus | null;
  note: string | null;
  decidedLabel: string | null;
  hasTime: boolean;
}) {
  const [pending, startTransition] = useTransition();

  function run(action: (week: string) => Promise<{ ok: boolean; error?: string }>, success: string) {
    startTransition(async () => {
      const result = await action(week);
      if (result.ok) toast.success(success);
      else toast.error("error" in result && result.error ? result.error : "Something went wrong.");
    });
  }

  const submit = (
    <Button size="sm" onClick={() => run(submitWeek, "Week submitted for approval")} disabled={pending || !hasTime}>
      <Send aria-hidden />
      {status === "rejected" ? "Resubmit week" : "Submit week for approval"}
    </Button>
  );

  const tone =
    status === "approved"
      ? "bg-success/10"
      : status === "rejected"
        ? "bg-destructive/10"
        : status === "submitted"
          ? "bg-accent"
          : "bg-muted";

  return (
    <div role="status" className={cn("flex flex-wrap items-center gap-3 rounded-xl px-4 py-3 text-sm", tone)}>
      {status === "approved" && <CheckCircle2 className="size-4 shrink-0 text-success" aria-hidden />}
      {status === "rejected" && <XCircle className="size-4 shrink-0 text-destructive" aria-hidden />}
      {(status === "submitted" || status === null) && <Clock3 className="size-4 shrink-0 text-brand" aria-hidden />}
      <p className="min-w-0 flex-1">
        {status === null && (
          <>
            {weekLabel} isn&apos;t submitted yet.{" "}
            {hasTime ? "Submit it when the week is complete." : "Add time before submitting."}
          </>
        )}
        {status === "submitted" && <>{weekLabel} is submitted and waiting for approval. Its time is locked.</>}
        {status === "approved" && (
          <>
            {weekLabel} is approved{decidedLabel ? ` by ${decidedLabel}` : ""}. Its time is locked.
          </>
        )}
        {status === "rejected" && (
          <>
            {weekLabel} was sent back{decidedLabel ? ` by ${decidedLabel}` : ""}.
            {note ? (
              <>
                {" "}
                <span className="font-medium">&ldquo;{note}&rdquo;</span>
              </>
            ) : null}{" "}
            Fix it and submit again.
          </>
        )}
      </p>
      {(status === null || status === "rejected") && submit}
      {status === "submitted" && (
        <Button size="sm" variant="outline" onClick={() => run(withdrawWeek, "Week withdrawn")} disabled={pending}>
          <Undo2 aria-hidden />
          Withdraw
        </Button>
      )}
    </div>
  );
}

"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { setTimesheetApproval } from "../actions";

/** Settings: turn timesheet approval on or off. */
export function TimesheetApprovalToggle({ enabled, disabled }: { enabled: boolean; disabled?: boolean }) {
  const [pending, startTransition] = useTransition();

  function toggle(next: boolean) {
    startTransition(async () => {
      const result = await setTimesheetApproval(next);
      if (result.ok) toast.success(next ? "Timesheet approval is on" : "Timesheet approval is off");
      else toast.error(result.error);
    });
  }

  return (
    <label className="flex cursor-pointer items-start gap-3 text-sm">
      <input
        type="checkbox"
        checked={enabled}
        disabled={disabled || pending}
        onChange={(event) => toggle(event.target.checked)}
        className="mt-0.5 size-4 accent-primary"
      />
      <span className="flex flex-col gap-0.5">
        <span className="font-medium">Require approval for timesheets</span>
        <span className="text-muted-foreground">
          People submit each week; owners and admins approve it on the Approvals page. Submitted and approved weeks
          are locked. Turning this off unlocks every week.
        </span>
      </span>
    </label>
  );
}

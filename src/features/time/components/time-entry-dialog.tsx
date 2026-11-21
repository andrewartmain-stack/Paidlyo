"use client";

import { useState } from "react";
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
import { FormError, FormField, SelectField, TextareaField } from "@/components/form-field";
import { useFormAction } from "@/hooks/use-form-action";
import { createTimeEntry, deleteTimeEntry, updateTimeEntry } from "../actions";
import { formatDuration } from "../duration";
import type { TimeEntry, TrackableProject } from "../types";

type TimeEntryDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: TrackableProject[];
  /** The day being tracked (ISO date). */
  date: string;
  dateLabel: string;
  isToday: boolean;
  /** Edit this entry; omit to create one. */
  entry?: TimeEntry;
};

export function TimeEntryDialog({ open, onOpenChange, ...formProps }: TimeEntryDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-6 p-6 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg">
            {formProps.entry ? "Edit time entry" : "Track time"}
          </DialogTitle>
          <DialogDescription>{formProps.dateLabel}</DialogDescription>
        </DialogHeader>
        {open && (
          <TimeEntryForm
            key={formProps.entry?.id ?? "new"}
            onDone={() => onOpenChange(false)}
            {...formProps}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function TimeEntryForm({
  projects,
  date,
  isToday,
  entry,
  onDone,
}: Omit<TimeEntryDialogProps, "open" | "onOpenChange" | "dateLabel"> & { onDone: () => void }) {
  // An archived project isn't trackable any more, but its existing entries stay editable.
  const options =
    entry && !projects.some((p) => p.id === entry.project.id)
      ? [{ ...entry.project, tasks: [entry.task] }, ...projects]
      : projects;

  const [projectId, setProjectId] = useState(entry?.project.id ?? options[0]?.id ?? "");
  const [durationEmpty, setDurationEmpty] = useState(!entry);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const project = options.find((p) => p.id === projectId);
  const tasks = project?.tasks ?? [];
  const defaultTaskId =
    entry && entry.project.id === projectId ? entry.task.id : (tasks[0]?.id ?? undefined);
  const running = entry?.timerStartedAt != null;
  const startsTimer = !entry && isToday && durationEmpty;

  const { onSubmit, pending, error, fieldErrors } = useFormAction(async (formData: FormData) => {
    const result = entry ? await updateTimeEntry(entry.id, formData) : await createTimeEntry(formData);
    if (result.ok) {
      toast.success(entry ? "Entry updated" : startsTimer ? "Timer started" : "Time tracked");
      onDone();
    }
    return result;
  });

  async function onDelete() {
    if (!entry) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setDeleting(true);
    const result = await deleteTimeEntry(entry.id);
    setDeleting(false);
    if (result.ok) {
      toast.success("Entry deleted");
      onDone();
    } else {
      toast.error(result.error);
    }
  }

  const busy = pending || deleting;

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6" noValidate>
      <FormError message={error} />
      <input type="hidden" name="spentDate" value={entry?.spentDate ?? date} />
      <fieldset disabled={busy} className="flex flex-col gap-5">
        <SelectField
          name="projectId"
          label="Project"
          options={options.map((p) => ({
            value: p.id,
            label: `${p.clientName} — ${p.name}${p.code ? ` (${p.code})` : ""}`,
          }))}
          defaultValue={projectId || undefined}
          onValueChange={setProjectId}
          errors={fieldErrors.projectId}
        />
        <SelectField
          key={projectId}
          name="taskId"
          label="Task"
          options={tasks.map((t) => ({ value: t.id, label: t.name }))}
          defaultValue={defaultTaskId}
          errors={fieldErrors.taskId}
        />
        <TextareaField
          name="notes"
          label="Notes"
          hint="Optional. Shown on invoices created from this time."
          rows={2}
          defaultValue={entry?.notes ?? ""}
          errors={fieldErrors.notes}
        />
        <FormField
          name="duration"
          label="Duration"
          hint={
            running
              ? "Stop the timer to change the duration."
              : isToday && !entry
                ? "Like 1:30 or 1.5. Leave empty to start a timer."
                : "Like 1:30 or 1.5."
          }
          placeholder="0:00"
          inputMode="decimal"
          autoComplete="off"
          disabled={running}
          defaultValue={entry ? formatDuration(entry.minutes) : ""}
          onChange={(e) => setDurationEmpty(e.target.value.trim() === "")}
          errors={fieldErrors.duration}
          className="max-w-32"
        />
      </fieldset>
      <DialogFooter className="-mx-6 -mb-6 px-6 sm:justify-between">
        {entry ? (
          <Button
            type="button"
            variant={confirmDelete ? "destructive" : "ghost"}
            disabled={busy}
            onClick={onDelete}
          >
            {deleting ? "Deleting…" : confirmDelete ? "Click again to delete" : "Delete"}
          </Button>
        ) : (
          <span />
        )}
        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          <DialogClose render={<Button type="button" variant="outline" disabled={busy} />}>
            Cancel
          </DialogClose>
          <Button type="submit" disabled={busy || options.length === 0}>
            {pending ? "Saving…" : startsTimer ? "Start timer" : "Save entry"}
          </Button>
        </div>
      </DialogFooter>
    </form>
  );
}

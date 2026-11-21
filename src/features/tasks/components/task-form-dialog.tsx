"use client";

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
import { CheckboxField, FormError, FormField } from "@/components/form-field";
import { useFormAction } from "@/hooks/use-form-action";
import { centsToInput } from "@/lib/form-schemas";
import { addTask, updateTask } from "../actions";
import type { Task } from "../types";

type TaskFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Edit this task; omit to create a new one. */
  task?: Task;
  currency: string;
};

export function TaskFormDialog({ open, onOpenChange, task, currency }: TaskFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-6 p-6 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg">{task ? "Edit task" : "New task"}</DialogTitle>
          <DialogDescription>
            Tasks describe the kind of work you track time for, like Design or Development.
          </DialogDescription>
        </DialogHeader>
        {open && (
          <TaskForm
            key={task?.id ?? "new"}
            task={task}
            currency={currency}
            onSaved={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function TaskForm({
  task,
  currency,
  onSaved,
}: {
  task?: Task;
  currency: string;
  onSaved: () => void;
}) {
  const { onSubmit, pending, error, fieldErrors } = useFormAction(async (formData: FormData) => {
    const result = task ? await updateTask(task.id, formData) : await addTask(formData);
    if (result.ok) {
      toast.success(task ? "Task updated" : "Task added");
      onSaved();
    }
    return result;
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6" noValidate>
      <FormError message={error} />
      <fieldset disabled={pending} className="flex flex-col gap-5">
        <FormField
          name="name"
          label="Name"
          defaultValue={task?.name}
          required
          autoFocus
          errors={fieldErrors.name}
        />
        <FormField
          name="defaultHourlyRateCents"
          label={`Default hourly rate (${currency})`}
          hint="Optional. Used by projects billed by task rate."
          inputMode="decimal"
          placeholder="0.00"
          defaultValue={centsToInput(task?.defaultHourlyRateCents ?? null)}
          errors={fieldErrors.defaultHourlyRateCents}
        />
        <CheckboxField
          name="isBillable"
          label="Billable by default"
          defaultChecked={task?.isBillable ?? true}
        />
        <CheckboxField
          name="isCommon"
          label="Common task"
          hint="Added automatically to new projects."
          defaultChecked={task?.isCommon ?? false}
        />
      </fieldset>
      <DialogFooter className="-mx-6 -mb-6 px-6">
        <DialogClose render={<Button type="button" variant="outline" disabled={pending} />}>
          Cancel
        </DialogClose>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : task ? "Save changes" : "Add task"}
        </Button>
      </DialogFooter>
    </form>
  );
}

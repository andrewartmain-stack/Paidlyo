"use client";

import { Clock } from "lucide-react";
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
import { FormError } from "@/components/form-field";
import { useFormAction } from "@/hooks/use-form-action";
import { addUnbilledTime } from "../actions";
import { UnbilledTimeFields } from "./unbilled-time-fields";

export function AddTimeButton({ disabled, onClick }: { disabled?: boolean; onClick: () => void }) {
  return (
    <Button type="button" variant="outline" className="w-fit" disabled={disabled} onClick={onClick}>
      <Clock aria-hidden />
      Add unbilled time
    </Button>
  );
}

/**
 * Controlled dialog. Render it OUTSIDE the invoice editor's <form>: React bubbles submit events
 * through portals, so a nested form would also trigger the editor's save, which replaces the
 * lines with the on-screen ones and drops the time lines just added.
 */
export function AddTimeDialog({
  open,
  onOpenChange: setOpen,
  invoiceId,
  clientName,
  unbilledLabel,
  defaultFrom,
  defaultTo,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: string;
  clientName: string;
  /** e.g. "12:30 unbilled (≈ $1,500.00)", or null when there is none. */
  unbilledLabel: string | null;
  defaultFrom: string;
  defaultTo: string;
}) {
  const { onSubmit, pending, error, fieldErrors } = useFormAction(async (formData: FormData) => {
    const result = await addUnbilledTime(invoiceId, formData);
    if (result.ok) {
      toast.success("Unbilled time added");
      setOpen(false);
    }
    return result;
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="gap-6 p-6 sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg">Add unbilled time</DialogTitle>
            <DialogDescription>
              {clientName}: {unbilledLabel ?? "no unbilled billable time right now."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={onSubmit} className="flex flex-col gap-6" noValidate>
            <FormError message={error} />
            <fieldset disabled={pending}>
              <UnbilledTimeFields fieldErrors={fieldErrors} defaultFrom={defaultFrom} defaultTo={defaultTo} />
            </fieldset>
            <DialogFooter className="-mx-6 -mb-6 px-6">
              <DialogClose render={<Button type="button" variant="outline" disabled={pending} />}>
                Cancel
              </DialogClose>
              <Button type="submit" disabled={pending}>
                {pending ? "Adding…" : "Add time"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
    </Dialog>
  );
}

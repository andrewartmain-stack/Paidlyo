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
import { FormError, FormField } from "@/components/form-field";
import { useFormAction } from "@/hooks/use-form-action";
import { centsToInput } from "@/lib/form-schemas";
import { setMemberRate } from "../actions";
import type { TeamMember } from "../types";

/** "Set billable rate" for one person; used by projects billed by person rate. */
export function MemberRateDialog({
  member,
  currency,
  onClose,
}: {
  /** The person being edited; null keeps the dialog closed. */
  member: TeamMember | null;
  currency: string;
  onClose: () => void;
}) {
  return (
    <Dialog open={member !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="gap-6 p-6 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg">Billable rate{member ? ` for ${member.name}` : ""}</DialogTitle>
          <DialogDescription>
            Used on projects billed by person hourly rate. Changes apply to time logged from now on.
          </DialogDescription>
        </DialogHeader>
        {member && <RateForm key={member.id} member={member} currency={currency} onDone={onClose} />}
      </DialogContent>
    </Dialog>
  );
}

function RateForm({ member, currency, onDone }: { member: TeamMember; currency: string; onDone: () => void }) {
  const { onSubmit, pending, error, fieldErrors } = useFormAction(async (formData: FormData) => {
    const result = await setMemberRate(formData);
    if (result.ok) {
      toast.success(`Rate saved for ${member.name}`);
      onDone();
    }
    return result;
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6" noValidate>
      <FormError message={error} />
      <input type="hidden" name="memberId" value={member.id} />
      <fieldset disabled={pending}>
        <FormField
          name="hourlyRate"
          label={`Hourly rate (${currency})`}
          inputMode="decimal"
          placeholder="0.00"
          hint="Leave empty to remove the rate."
          defaultValue={centsToInput(member.hourlyRateCents)}
          errors={fieldErrors.hourlyRate}
          className="max-w-48"
        />
      </fieldset>
      <DialogFooter>
        <DialogClose render={<Button variant="outline" type="button" />}>Cancel</DialogClose>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save rate"}
        </Button>
      </DialogFooter>
    </form>
  );
}

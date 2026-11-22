"use client";

import { useState } from "react";
import { Copy, UserPlus } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { FormError, FormField, SelectField } from "@/components/form-field";
import { useFormAction } from "@/hooks/use-form-action";
import { createInvite } from "../actions";
import { ROLE_DESCRIPTIONS, ROLE_LABELS, type InviteRole } from "../rules";
import { copyLink } from "./copy-link";

/** "Invite person": pick a role (and optionally note their email), then copy the link to share. */
export function InviteButton({ roles }: { roles: InviteRole[] }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <UserPlus aria-hidden />
        Invite person
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="gap-6 p-6 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg">Invite a teammate</DialogTitle>
            <DialogDescription>
              You&apos;ll get a private link to send them by email or chat. It works once and expires in 14 days.
            </DialogDescription>
          </DialogHeader>
          {open && <InviteForm roles={roles} />}
        </DialogContent>
      </Dialog>
    </>
  );
}

function InviteForm({ roles }: { roles: InviteRole[] }) {
  const [role, setRole] = useState<InviteRole>("member");
  const { onSubmit, pending, error, fieldErrors, result } = useFormAction(createInvite);
  const url = result?.ok ? result.data.url : null;

  if (url) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm">
          Send this link to your teammate. They&apos;ll create an account (or log in) and join right away.
        </p>
        <div className="flex gap-2">
          <Input readOnly value={url} aria-label="Invite link" onFocus={(event) => event.currentTarget.select()} />
          <Button type="button" onClick={() => copyLink(url)}>
            <Copy aria-hidden />
            Copy
          </Button>
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Done</DialogClose>
        </DialogFooter>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6" noValidate>
      <FormError message={error} />
      <fieldset disabled={pending} className="flex flex-col gap-5">
        <SelectField
          name="role"
          label="Role"
          defaultValue="member"
          options={roles.map((value) => ({ value, label: ROLE_LABELS[value] }))}
          onValueChange={(value) => setRole(value === "admin" ? "admin" : "member")}
          hint={ROLE_DESCRIPTIONS[role]}
          errors={fieldErrors.role}
        />
        <FormField
          name="email"
          label="Their email"
          type="email"
          hint="Optional. Only to remember who the link is for."
          errors={fieldErrors.email}
        />
      </fieldset>
      <DialogFooter>
        <DialogClose render={<Button variant="outline" type="button" />}>Cancel</DialogClose>
        <Button type="submit" disabled={pending}>
          {pending ? "Creating link…" : "Create invite link"}
        </Button>
      </DialogFooter>
    </form>
  );
}

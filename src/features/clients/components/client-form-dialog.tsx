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
import {
  FormError,
  FormField,
  SelectField,
  TextareaField,
  type SelectOption,
} from "@/components/form-field";
import { useFormAction } from "@/hooks/use-form-action";
import { addClient, updateClient } from "../actions";
import type { Client } from "../types";

type ClientFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Edit this client; omit to create a new one. */
  client?: Client;
  currencies: SelectOption[];
  defaultCurrency: string;
};

export function ClientFormDialog({ open, onOpenChange, ...formProps }: ClientFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-6 p-6 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg">{formProps.client ? "Edit client" : "New client"}</DialogTitle>
          <DialogDescription>
            Name, email and address appear on invoices you send to this client.
          </DialogDescription>
        </DialogHeader>
        {/* Remount per open/client so the form starts from the saved values. */}
        {open && (
          <ClientForm
            key={formProps.client?.id ?? "new"}
            onSaved={() => onOpenChange(false)}
            {...formProps}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function ClientForm({
  client,
  currencies,
  defaultCurrency,
  onSaved,
}: Omit<ClientFormDialogProps, "open" | "onOpenChange"> & { onSaved: () => void }) {
  const { onSubmit, pending, error, fieldErrors } = useFormAction(async (formData: FormData) => {
    const result = client ? await updateClient(client.id, formData) : await addClient(formData);
    if (result.ok) {
      toast.success(client ? "Client updated" : "Client added");
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
          defaultValue={client?.name}
          autoComplete="organization"
          required
          autoFocus
          errors={fieldErrors.name}
        />
        <FormField
          name="email"
          label="Email"
          type="email"
          hint="Optional. Where invoices are sent."
          defaultValue={client?.email ?? ""}
          autoComplete="email"
          errors={fieldErrors.email}
        />
        <TextareaField
          name="address"
          label="Address"
          hint="Optional."
          rows={3}
          defaultValue={client?.address ?? ""}
          errors={fieldErrors.address}
        />
        <SelectField
          name="currency"
          label="Currency"
          hint="Invoices for this client use this currency."
          options={currencies}
          defaultValue={client?.currency ?? defaultCurrency}
          errors={fieldErrors.currency}
        />
      </fieldset>
      <DialogFooter className="-mx-6 -mb-6 px-6">
        <DialogClose render={<Button type="button" variant="outline" disabled={pending} />}>
          Cancel
        </DialogClose>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : client ? "Save changes" : "Add client"}
        </Button>
      </DialogFooter>
    </form>
  );
}

"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  FormError,
  FormField,
  SelectField,
  TextareaField,
  type SelectOption,
} from "@/components/form-field";
import { useFormAction } from "@/hooks/use-form-action";
import { updateOrganization } from "../actions";
import type { CurrentOrg } from "../types";

async function save(formData: FormData) {
  const result = await updateOrganization(formData);
  if (result.ok) toast.success("Settings saved");
  return result;
}

export function OrganizationSettingsForm({
  org,
  currencies,
  timeZones,
  disabled,
}: {
  org: CurrentOrg;
  currencies: SelectOption[];
  timeZones: SelectOption[];
  disabled: boolean;
}) {
  const { onSubmit, pending, error, fieldErrors } = useFormAction(save);

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6" noValidate>
      <FormError message={error} />
      <fieldset disabled={disabled || pending} className="grid gap-5 md:grid-cols-2">
        <FormField
          name="name"
          label="Company name"
          defaultValue={org.name}
          autoComplete="organization"
          required
          errors={fieldErrors.name}
        />
        <SelectField
          name="currency"
          label="Default currency"
          options={currencies}
          defaultValue={org.currency}
          errors={fieldErrors.currency}
        />
        <TextareaField
          name="address"
          label="Address"
          hint="Shown on your invoices."
          rows={4}
          defaultValue={org.address}
          autoComplete="street-address"
          errors={fieldErrors.address}
          className="md:col-span-2"
        />
        <FormField
          name="defaultTaxRate"
          label="Default tax rate (%)"
          hint="Applied to new invoices. Use 0 for no tax."
          inputMode="decimal"
          defaultValue={String(org.defaultTaxRate)}
          errors={fieldErrors.defaultTaxRate}
        />
        <SelectField
          name="timezone"
          label="Timezone"
          options={timeZones}
          defaultValue={org.timezone}
          errors={fieldErrors.timezone}
        />
        <FormField
          name="invoicePrefix"
          label="Invoice number prefix"
          hint="For example INV- gives INV-0001."
          defaultValue={org.invoicePrefix}
          maxLength={10}
          errors={fieldErrors.invoicePrefix}
        />
        <FormField
          name="nextInvoiceNumber"
          label="Next invoice number"
          hint="Continue your numbering from Harvest or another tool."
          inputMode="numeric"
          defaultValue={String(org.nextInvoiceNumber)}
          errors={fieldErrors.nextInvoiceNumber}
        />
      </fieldset>
      {!disabled && (
        <div>
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save changes"}
          </Button>
        </div>
      )}
    </form>
  );
}

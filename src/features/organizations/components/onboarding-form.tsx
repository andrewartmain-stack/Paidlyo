"use client";

import { Button } from "@/components/ui/button";
import { FormError, FormField, SelectField, type SelectOption } from "@/components/form-field";
import { useFormAction } from "@/hooks/use-form-action";
import { createOrganization } from "../actions";

function submitWithBrowserTimeZone(formData: FormData) {
  // Timezone is detected from the browser; it can be changed later in Settings.
  formData.set("timezone", Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");
  return createOrganization(formData);
}

export function OnboardingForm({ currencies }: { currencies: SelectOption[] }) {
  const { onSubmit, pending, error, fieldErrors } = useFormAction(submitWithBrowserTimeZone);

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      <FormError message={error ?? fieldErrors.timezone?.[0] ?? null} />
      <FormField
        name="name"
        label="Company name"
        hint="Shown on your invoices. Use your own name if you freelance."
        autoComplete="organization"
        required
        errors={fieldErrors.name}
      />
      <SelectField
        name="currency"
        label="Default currency"
        hint="Used for new clients and invoices. You can change it per client."
        options={currencies}
        defaultValue="USD"
        errors={fieldErrors.currency}
      />
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Setting up…" : "Continue"}
      </Button>
    </form>
  );
}

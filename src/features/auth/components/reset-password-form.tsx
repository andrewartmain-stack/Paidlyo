"use client";

import { Button } from "@/components/ui/button";
import { useFormAction } from "@/hooks/use-form-action";
import { updatePassword } from "../actions";
import { FormError, FormField } from "@/components/form-field";

export function ResetPasswordForm() {
  const { onSubmit, pending, error, fieldErrors } = useFormAction(updatePassword);

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      <FormError message={error} />
      <FormField
        name="password"
        label="New password"
        type="password"
        autoComplete="new-password"
        required
        minLength={8}
        errors={fieldErrors.password}
      />
      <FormField
        name="confirmPassword"
        label="Confirm new password"
        type="password"
        autoComplete="new-password"
        required
        errors={fieldErrors.confirmPassword}
      />
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Saving…" : "Set new password"}
      </Button>
    </form>
  );
}

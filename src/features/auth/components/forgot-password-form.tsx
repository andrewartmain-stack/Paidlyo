"use client";

import { Button } from "@/components/ui/button";
import { useFormAction } from "@/hooks/use-form-action";
import { requestPasswordReset } from "../actions";
import { FormError, FormField } from "@/components/form-field";

export function ForgotPasswordForm() {
  const { onSubmit, pending, result, error, fieldErrors } = useFormAction(requestPasswordReset);

  if (result?.ok) {
    return (
      <div role="status" className="flex flex-col gap-2 text-center">
        <h2 className="text-xl">Check your email</h2>
        <p className="text-sm text-muted-foreground">
          If an account exists for that email, we sent a link to reset your password.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      <FormError message={error} />
      <FormField
        name="email"
        label="Email"
        type="email"
        autoComplete="email"
        required
        errors={fieldErrors.email}
      />
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Sending…" : "Send reset link"}
      </Button>
    </form>
  );
}

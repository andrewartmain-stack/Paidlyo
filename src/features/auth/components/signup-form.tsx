"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useFormAction } from "@/hooks/use-form-action";
import { signUp } from "../actions";
import { FormError, FormField } from "@/components/form-field";
import { OAuthButtons } from "./oauth-buttons";

export function SignupForm() {
  // ?next, e.g. an invite link to return to after signing up.
  const next = useSearchParams().get("next") ?? "";
  const { onSubmit, pending, result, error, fieldErrors } = useFormAction(signUp);

  if (result?.ok && result.data.needsConfirmation) {
    return (
      <div role="status" className="flex flex-col gap-2 text-center">
        <h2 className="text-xl">Check your email</h2>
        <p className="text-sm text-muted-foreground">
          We sent you a confirmation link. Open it to activate your account.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <OAuthButtons next={next || undefined} />
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <FormError message={error} />
        <input type="hidden" name="next" value={next} />
        <FormField
          name="fullName"
          label="Your name"
          autoComplete="name"
          required
          errors={fieldErrors.fullName}
        />
        <FormField
          name="email"
          label="Work email"
          type="email"
          autoComplete="email"
          required
          errors={fieldErrors.email}
        />
        <FormField
          name="password"
          label="Password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          errors={fieldErrors.password}
        />
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Creating account…" : "Create account"}
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          By creating an account you agree to the{" "}
          <Link href="/terms" className="underline underline-offset-4 hover:text-foreground">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline underline-offset-4 hover:text-foreground">
            Privacy Policy
          </Link>
          .
        </p>
      </form>
    </div>
  );
}

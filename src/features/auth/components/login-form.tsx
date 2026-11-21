"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useFormAction } from "@/hooks/use-form-action";
import { signIn } from "../actions";
import { FormError, FormField } from "@/components/form-field";
import { OAuthButtons } from "./oauth-buttons";

const LINK_ERRORS: Record<string, string> = {
  link: "That link is invalid or has expired. Log in or request a new one.",
  oauth: "We couldn't sign you in with that account. Please try again or use your email.",
};

export function LoginForm() {
  const searchParams = useSearchParams();
  const linkError = LINK_ERRORS[searchParams.get("error") ?? ""] ?? null;
  const { onSubmit, pending, error, fieldErrors } = useFormAction(signIn);

  return (
    <div className="flex flex-col gap-4">
      <FormError message={linkError} />
      <OAuthButtons next={searchParams.get("next") ?? undefined} />
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <FormError message={error} />
        <input type="hidden" name="next" value={searchParams.get("next") ?? ""} />
        <FormField
          name="email"
          label="Email"
          type="email"
          autoComplete="email"
          required
          errors={fieldErrors.email}
        />
        <div className="flex flex-col gap-1.5">
          <FormField
            name="password"
            label="Password"
            type="password"
            autoComplete="current-password"
            required
            errors={fieldErrors.password}
          />
          <Link
            href="/forgot-password"
            className="self-end text-sm text-brand underline-offset-4 hover:underline"
          >
            Forgot password?
          </Link>
        </div>
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Logging in…" : "Log in"}
        </Button>
      </form>
    </div>
  );
}

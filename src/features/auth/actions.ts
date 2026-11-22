"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import type { AuthError } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { absoluteUrl } from "@/lib/site-url";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import { safeNext } from "./redirect";
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
} from "./schemas";

function invalid(error: z.ZodError) {
  return fail("Please fix the highlighted fields.", z.flattenError(error).fieldErrors);
}

function authErrorMessage(error: AuthError): string {
  switch (error.code) {
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "Too many attempts. Please wait a few minutes and try again.";
    case "weak_password":
      return "That password is too weak. Try a longer one.";
    case "same_password":
      return "Choose a password different from your current one.";
    default:
      return "Something went wrong. Please try again.";
  }
}

export async function signUp(
  formData: FormData,
): Promise<ActionResult<{ needsConfirmation: boolean }>> {
  const parsed = signUpSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(parsed.error);
  const { fullName, email, password } = parsed.data;
  const next = safeNext(formData.get("next"));

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      // With Supabase's default email template the confirm link returns here with a one-time code.
      emailRedirectTo: absoluteUrl(`/auth/callback?next=${encodeURIComponent(next)}`),
    },
  });
  if (error) return fail(authErrorMessage(error));

  // Email confirmation off → already signed in.
  if (data.session) redirect(next);

  // Same response whether or not the email is already registered (no account enumeration).
  return ok({ needsConfirmation: true });
}

export async function signIn(formData: FormData): Promise<ActionResult> {
  const parsed = signInSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(parsed.error);

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    if (error.code === "email_not_confirmed") {
      return fail("Please confirm your email first. Check your inbox for the link.");
    }
    if (error.code === "invalid_credentials") return fail("Invalid email or password.");
    return fail(authErrorMessage(error));
  }

  redirect(safeNext(formData.get("next")));
}

const providerSchema = z.enum(["google"]);

/**
 * "Continue with Google": sends the user to the provider. Supabase creates the account
 * on first sign-in; /auth/callback finishes the sign-in (PKCE code exchange).
 */
export async function signInWithProvider(formData: FormData): Promise<void> {
  const provider = providerSchema.safeParse(formData.get("provider"));
  if (!provider.success) redirect("/login");

  const next = safeNext(formData.get("next"));
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: provider.data,
    options: {
      redirectTo: absoluteUrl(`/auth/callback?next=${encodeURIComponent(next)}`),
    },
  });
  if (error || !data.url) redirect("/login?error=oauth");
  redirect(data.url);
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function requestPasswordReset(formData: FormData): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(parsed.error);

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: absoluteUrl("/auth/callback?next=/reset-password"),
  });
  // Rate limits are worth reporting; anything else would reveal whether the email exists.
  if (error && error.status === 429) return fail(authErrorMessage(error));

  return ok();
}

/** Sets a new password for the user signed in via the reset link. */
export async function updatePassword(formData: FormData): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(parsed.error);

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) {
    return fail("Your reset link has expired. Request a new one.");
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return fail(authErrorMessage(error));

  redirect("/app");
}

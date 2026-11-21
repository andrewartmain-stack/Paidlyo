import type { Metadata } from "next";
import { AuthCard } from "@/features/auth/components/auth-card";
import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";

export const metadata: Metadata = { title: "Set a new password" };

// Reached from the reset email via /auth/confirm, which signs the user in first.
export default function ResetPasswordPage() {
  return (
    <AuthCard title="Set a new password" description="Choose a password with at least 8 characters.">
      <ResetPasswordForm />
    </AuthCard>
  );
}

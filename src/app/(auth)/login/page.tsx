import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AuthCard } from "@/features/auth/components/auth-card";
import { LoginForm } from "@/features/auth/components/login-form";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <AuthCard
      title="Log in"
      description="Welcome back. Log in to track time and send invoices."
      footer={
        <>
          New to Paidlyo?{" "}
          <Link href="/signup" className="text-brand underline-offset-4 hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      {/* LoginForm reads ?next and ?error, which is request data. */}
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthCard>
  );
}

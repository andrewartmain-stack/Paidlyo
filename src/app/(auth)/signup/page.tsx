import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AuthCard } from "@/features/auth/components/auth-card";
import { SignupForm } from "@/features/auth/components/signup-form";

export const metadata: Metadata = { title: "Create your account" };

export default function SignupPage() {
  return (
    <AuthCard
      title="Create your account"
      description="Track time and get paid. Set up takes a minute."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="text-brand underline-offset-4 hover:underline">
            Log in
          </Link>
        </>
      }
    >
      {/* SignupForm reads ?next, which is request data. */}
      <Suspense>
        <SignupForm />
      </Suspense>
    </AuthCard>
  );
}

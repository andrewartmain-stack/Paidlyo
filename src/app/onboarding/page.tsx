import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AuthCard } from "@/features/auth/components/auth-card";
import { OnboardingForm } from "@/features/organizations/components/onboarding-form";
import { currencyOptions } from "@/features/organizations/options";
import { findCurrentOrg } from "@/features/organizations/queries";

export default function OnboardingPage() {
  return (
    <AuthCard
      title="Set up your workspace"
      description="Tell us a little about your business. You can change this later in Settings."
    >
      <Suspense>
        <Onboarding />
      </Suspense>
    </AuthCard>
  );
}

async function Onboarding() {
  // Already set up → straight to the dashboard.
  if (await findCurrentOrg()) redirect("/app");
  return <OnboardingForm currencies={currencyOptions()} />;
}

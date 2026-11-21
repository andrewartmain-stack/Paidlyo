import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { Building2, CreditCard, FileUp, ImageIcon, Settings } from "lucide-react";
import { PageIcon } from "@/components/page-icon";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogoUploader } from "@/features/organizations/components/logo-uploader";
import { OrganizationSettingsForm } from "@/features/organizations/components/organization-settings-form";
import { currencyOptions, timeZoneOptions } from "@/features/organizations/options";
import { canManageOrg, getCurrentOrg } from "@/features/organizations/queries";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-4">
        <PageIcon icon={Settings} />
        <div>
          <h1 className="text-3xl">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your organization details appear on every invoice you send.
          </p>
        </div>
      </div>
      <Suspense fallback={<div className="h-96 rounded-xl bg-muted" />}>
        <OrganizationSettings />
      </Suspense>
    </div>
  );
}

async function OrganizationSettings() {
  const org = await getCurrentOrg();
  const readOnly = !canManageOrg(org);

  return (
    <div className="grid gap-6 xl:grid-cols-3">
      <Card className="xl:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <Building2 className="size-5 text-brand" aria-hidden />
            Organization
          </CardTitle>
          {readOnly && (
            <CardDescription>Only owners and admins can change these settings.</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <OrganizationSettingsForm
            org={org}
            currencies={currencyOptions()}
            timeZones={timeZoneOptions()}
            disabled={readOnly}
          />
        </CardContent>
      </Card>
      <div className="flex flex-col gap-6 self-start">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <ImageIcon className="size-5 text-brand" aria-hidden />
              Logo
            </CardTitle>
            <CardDescription>Shown at the top of your invoices.</CardDescription>
          </CardHeader>
          <CardContent>
            <LogoUploader logoUrl={org.logoUrl} disabled={readOnly} />
          </CardContent>
        </Card>
        {!readOnly && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <CreditCard className="size-5 text-brand" aria-hidden />
                Billing
              </CardTitle>
              <CardDescription>Your plan, payment method and invoices.</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/app/settings/billing" className={buttonVariants({ variant: "outline" })}>
                <CreditCard aria-hidden />
                Manage plan
              </Link>
            </CardContent>
          </Card>
        )}
        {!readOnly && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <FileUp className="size-5 text-brand" aria-hidden />
                Import from Harvest
              </CardTitle>
              <CardDescription>Bring over clients, projects, tasks and time from a Harvest CSV export.</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/app/settings/import" className={buttonVariants({ variant: "outline" })}>
                <FileUp aria-hidden />
                Import data
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

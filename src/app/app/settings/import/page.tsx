import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ImportIllustration } from "@/components/illustrations";
import { getCurrentUser } from "@/features/auth/queries";
import { HarvestImport } from "@/features/import/components/harvest-import";
import { canManageOrg, getCurrentOrg } from "@/features/organizations/queries";

export const metadata: Metadata = { title: "Import from Harvest" };

export default function ImportPage() {
  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Link
          href="/app/settings"
          className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Settings
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex max-w-lg flex-col gap-1">
            <h1 className="text-3xl">Import from Harvest</h1>
            <p className="text-sm text-muted-foreground">
              Bring your clients, projects, tasks and tracked time over from Harvest. Importing the same file twice
              won&apos;t duplicate anything.
            </p>
          </div>
          <ImportIllustration className="h-28 w-auto" />
        </div>
      </div>
      <Suspense fallback={<div className="h-96 rounded-xl bg-muted" />}>
        <Import />
      </Suspense>
    </div>
  );
}

async function Import() {
  const [org, user] = await Promise.all([getCurrentOrg(), getCurrentUser()]);
  if (!canManageOrg(org)) redirect("/app/settings");
  return <HarvestImport userName={user.fullName.trim()} />;
}

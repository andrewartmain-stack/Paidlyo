import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ClientsIllustration } from "@/components/illustrations";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { listClients } from "@/features/clients/queries";
import { NewInvoiceForm } from "@/features/invoices/components/new-invoice-form";
import { getUnbilledByClient } from "@/features/invoices/queries";
import { newInvoicePrefillSchema } from "@/features/invoices/schemas";
import { unbilledLabel } from "@/features/invoices/unbilled";
import { canManageOrg, getCurrentOrg } from "@/features/organizations/queries";
import { todayIn } from "@/features/time/dates";

export const metadata: Metadata = { title: "New invoice" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default function NewInvoicePage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl">New invoice</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pick the client and dates. You&apos;ll add line items on the next screen.
        </p>
      </div>
      <Suspense fallback={<div className="h-72 max-w-xl rounded-xl bg-muted" />}>
        <NewInvoice searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function NewInvoice({ searchParams }: { searchParams: SearchParams }) {
  const prefill = newInvoicePrefillSchema.parse(await searchParams);
  const org = await getCurrentOrg();
  if (!canManageOrg(org)) redirect("/app/invoices");
  const [clients, unbilled] = await Promise.all([listClients({ status: "active", q: "" }), getUnbilledByClient()]);
  const unbilledLabels = Object.fromEntries(
    clients.flatMap((c) => {
      const label = unbilledLabel(unbilled.get(c.id), c.currency);
      return label ? [[c.id, label]] : [];
    }),
  );

  const defaultClientId = clients.some((c) => c.id === prefill.client) ? prefill.client : undefined;

  if (clients.length === 0) {
    return (
      <EmptyState
          illustration={<ClientsIllustration className="h-32 w-auto" />}
        title="Add a client first"
        description="Invoices are always for a client."
      >
        <Link href="/app/clients" className={buttonVariants({ variant: "outline" })}>
          Go to clients
        </Link>
      </EmptyState>
    );
  }

  return (
    <Card className="max-w-2xl">
      <CardContent>
        <NewInvoiceForm
          clients={clients.map((c) => ({ value: c.id, label: `${c.name} (${c.currency})` }))}
          unbilled={unbilledLabels}
          today={todayIn(org.timezone)}
          defaultClientId={defaultClientId}
          defaultSource={prefill.source}
        />
      </CardContent>
    </Card>
  );
}

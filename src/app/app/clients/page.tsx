import { Users } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { ClientsIllustration } from "@/components/illustrations";
import { PageIcon } from "@/components/page-icon";
import { ClientsFilters } from "@/features/clients/components/clients-filters";
import { ClientsTable } from "@/features/clients/components/clients-table";
import { NewClientButton } from "@/features/clients/components/new-client-button";
import { listClients } from "@/features/clients/queries";
import { clientFiltersSchema } from "@/features/clients/schemas";
import { currencyOptions } from "@/features/organizations/options";
import { canManageOrg, getCurrentOrg } from "@/features/organizations/queries";

export const metadata: Metadata = { title: "Clients" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default function ClientsPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <div className="flex flex-col gap-6">
      <Suspense fallback={<ClientsSkeleton />}>
        <Clients searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Clients({ searchParams }: { searchParams: SearchParams }) {
  const filters = clientFiltersSchema.parse(await searchParams);
  const [org, clients] = await Promise.all([getCurrentOrg(), listClients(filters)]);
  const canManage = canManageOrg(org);
  const currencies = canManage ? currencyOptions() : [];
  const dateFormat = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: org.timezone });
  const rows = clients.map((c) => ({ ...c, createdLabel: dateFormat.format(new Date(c.createdAt)) }));

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-4">
          <PageIcon icon={Users} />
          <div>
            <h1 className="text-3xl">Clients</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              The companies and people you track time for and invoice.
            </p>
          </div>
        </div>
        {canManage && <NewClientButton currencies={currencies} defaultCurrency={org.currency} />}
      </div>

      <ClientsFilters filters={filters} />

      {rows.length > 0 ? (
        <ClientsTable
          clients={rows}
          canManage={canManage}
          currencies={currencies}
          defaultCurrency={org.currency}
        />
      ) : (
        <EmptyState filters={filters} />
      )}
    </>
  );
}

function EmptyState({ filters }: { filters: { status: string; q: string } }) {
  const [title, body] = filters.q
    ? [`No clients match “${filters.q}”`, "Try a different name, or clear the search."]
    : filters.status === "archived"
      ? ["No archived clients", "Clients you archive appear here and can be restored at any time."]
      : ["No clients yet", "Add your first client to start tracking time and sending invoices."];

  return (
    <div className="flex flex-col items-center gap-1 rounded-xl border border-dashed bg-card px-6 py-12 text-center">
      <ClientsIllustration className="mb-3 h-32 w-auto" />
      <h2 className="text-base">{title}</h2>
      <p className="max-w-sm text-sm text-muted-foreground">{body}</p>
    </div>
  );
}

function ClientsSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading clients" className="flex flex-col gap-6">
      <div className="h-14 w-64 rounded-lg bg-muted" />
      <div className="h-9 w-full rounded-lg bg-muted" />
      <div className="h-80 rounded-xl bg-muted" />
    </div>
  );
}

import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { FileText, Plus } from "lucide-react";
import { InvoiceIllustration } from "@/components/illustrations";
import { PageIcon } from "@/components/page-icon";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { StatusTabs } from "@/components/status-tabs";
import { InvoicesTable } from "@/features/invoices/components/invoices-table";
import { listInvoices } from "@/features/invoices/queries";
import { invoiceFiltersSchema, type InvoiceFilter } from "@/features/invoices/schemas";
import { canManageOrg, getCurrentOrg } from "@/features/organizations/queries";
import { todayIn } from "@/features/time/dates";

export const metadata: Metadata = { title: "Invoices" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const TABS: { status: InvoiceFilter; label: string }[] = [
  { status: "all", label: "All" },
  { status: "draft", label: "Draft" },
  { status: "sent", label: "Sent" },
  { status: "overdue", label: "Overdue" },
  { status: "paid", label: "Paid" },
  { status: "void", label: "Void" },
];

const EMPTY: Record<InvoiceFilter, [string, string]> = {
  all: ["No invoices yet", "Create your first invoice for a client. You can save it as a draft and send it later."],
  draft: ["No drafts", "Invoices you haven't sent yet appear here."],
  sent: ["No sent invoices", "Invoices you've marked as sent appear here until they're paid."],
  overdue: ["Nothing overdue", "Sent invoices past their due date appear here."],
  paid: ["No paid invoices yet", "Invoices appear here once you record their full payment."],
  void: ["No void invoices", "Voided invoices are kept here for your records."],
};

export default function InvoicesPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <div className="flex flex-col gap-6">
      <Suspense fallback={<ListSkeleton />}>
        <Invoices searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Invoices({ searchParams }: { searchParams: SearchParams }) {
  const { status } = invoiceFiltersSchema.parse(await searchParams);
  const org = await getCurrentOrg();

  if (!canManageOrg(org)) {
    return (
      <>
        <h1 className="text-3xl">Invoices</h1>
        <EmptyState title="Invoices are private" description="Only owners and admins can see and create invoices." />
      </>
    );
  }

  const today = todayIn(org.timezone);
  const invoices = await listInvoices(status, today);
  const [emptyTitle, emptyDescription] = EMPTY[status];

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-4">
          <PageIcon icon={FileText} />
          <div>
            <h1 className="text-3xl">Invoices</h1>
            <p className="mt-1 text-sm text-muted-foreground">Bill your clients and keep track of what&apos;s been sent.</p>
          </div>
        </div>
        <Link href="/app/invoices/new" className={buttonVariants()}>
          <Plus aria-hidden />
          New invoice
        </Link>
      </div>

      <StatusTabs
        label="Invoice status"
        tabs={TABS.map((tab) => ({
          href: tab.status === "all" ? "/app/invoices" : `/app/invoices?status=${tab.status}`,
          label: tab.label,
          active: status === tab.status,
        }))}
      />

      {invoices.length > 0 ? (
        <InvoicesTable invoices={invoices} />
      ) : (
        <EmptyState
          illustration={<InvoiceIllustration className="h-32 w-auto" />}
          title={emptyTitle}
          description={emptyDescription}
        />
      )}
    </>
  );
}

function ListSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading invoices" className="flex flex-col gap-6">
      <div className="h-14 w-64 rounded-lg bg-muted" />
      <div className="h-9 w-80 rounded-lg bg-muted" />
      <div className="h-80 rounded-xl bg-muted" />
    </div>
  );
}

import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { InvoiceDocument } from "@/features/invoices/components/invoice-document";
import { InvoiceStatusBadge } from "@/features/invoices/components/invoice-status-badge";
import { PrintButton } from "@/features/invoices/components/print-button";
import { getInvoice } from "@/features/invoices/queries";
import { canManageOrg, getCurrentOrg } from "@/features/organizations/queries";
import { todayIn } from "@/features/time/dates";

export const metadata: Metadata = { title: "Invoice preview" };

type Params = Promise<{ id: string }>;

export default function InvoicePreviewPage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<PreviewSkeleton />}>
      <Preview params={params} />
    </Suspense>
  );
}

async function Preview({ params }: { params: Params }) {
  const { id } = await params;
  const org = await getCurrentOrg();
  if (!canManageOrg(org)) redirect("/app/invoices");
  const invoice = await getInvoice(id, todayIn(org.timezone));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4 print:hidden">
        <div className="flex flex-col gap-1">
          <Link
            href={`/app/invoices/${invoice.id}`}
            className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Back to invoice
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl">Preview</h1>
            <InvoiceStatusBadge status={invoice.displayStatus} />
          </div>
        </div>
        <div className="flex flex-col gap-1 sm:items-end">
          <PrintButton />
          <p className="text-xs text-muted-foreground">
            Choose &ldquo;Save as PDF&rdquo; and turn off &ldquo;Headers and footers&rdquo;.
          </p>
        </div>
      </div>

      <InvoiceDocument
        invoice={{ ...invoice, items: invoice.items.map((item) => ({ ...item, key: item.id })) }}
        sender={{ name: org.name, address: org.address, logoUrl: org.logoUrl }}
      />
    </div>
  );
}

function PreviewSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading invoice" className="flex flex-col gap-6">
      <div className="h-16 w-72 rounded-lg bg-muted" />
      <div className="mx-auto h-[40rem] w-full max-w-[52rem] rounded-xl bg-muted" />
    </div>
  );
}

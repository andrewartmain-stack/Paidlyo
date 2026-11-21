import type { Metadata } from "next";
import { Suspense } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { InvoiceEditor } from "@/features/invoices/components/invoice-editor";
import { getInvoice, getUnbilledByClient } from "@/features/invoices/queries";
import { invoiceNoticeSchema } from "@/features/invoices/schemas";
import { unbilledLabel } from "@/features/invoices/unbilled";
import { canManageOrg, getCurrentOrg } from "@/features/organizations/queries";
import { todayIn } from "@/features/time/dates";

export const metadata: Metadata = { title: "Invoice" };

type Params = Promise<{ id: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default function InvoicePage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  return (
    <Suspense fallback={<EditorSkeleton />}>
      <Invoice params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function Invoice({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const [{ id }, { notice }] = await Promise.all([params, searchParams.then((p) => invoiceNoticeSchema.parse(p))]);
  const org = await getCurrentOrg();
  if (!canManageOrg(org)) redirect("/app/invoices");
  const today = todayIn(org.timezone);
  const [invoice, unbilled, origin] = await Promise.all([getInvoice(id, today), getUnbilledByClient(), siteOrigin()]);

  return (
    // Remount after each save/status change so the editor shows the stored values.
    <InvoiceEditor
      key={`${invoice.updatedAt}:${invoice.status}`}
      invoice={invoice}
      notice={notice}
      shareUrl={`${origin}/i/${invoice.shareToken}`}
      today={today}
      time={{
        unbilledLabel: unbilledLabel(unbilled.get(invoice.client.id), invoice.currency),
        defaultFrom: `${today.slice(0, 8)}01`,
        defaultTo: today,
      }}
    />
  );
}

/** Origin for client links: NEXT_PUBLIC_APP_URL when set, else the current request's host. */
async function siteOrigin(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_APP_URL;
  if (configured) return configured.replace(/\/+$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

function EditorSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading invoice" className="flex flex-col gap-6">
      <div className="h-16 w-72 rounded-lg bg-muted" />
      <div className="h-32 rounded-xl bg-muted" />
      <div className="h-72 rounded-xl bg-muted" />
    </div>
  );
}

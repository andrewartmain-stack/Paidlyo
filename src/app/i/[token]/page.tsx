import type { Metadata } from "next";
import { Suspense } from "react";
import { FileX } from "lucide-react";
import { InvoiceDocument } from "@/features/invoices/components/invoice-document";
import { PrintButton } from "@/features/invoices/components/print-button";
import { getSharedInvoice } from "@/features/invoices/queries";

// Client link: public but private. Never indexed, and the token never leaks via Referer.
export const metadata: Metadata = {
  title: "Invoice",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

type Params = Promise<{ token: string }>;

export default function SharedInvoicePage({ params }: { params: Params }) {
  return (
    <div className="min-h-svh bg-muted/40 px-4 py-8 sm:py-12 print:bg-transparent print:p-0">
      <Suspense fallback={<div aria-busy="true" className="mx-auto h-[40rem] w-full max-w-[52rem] rounded-xl bg-muted" />}>
        <SharedInvoice params={params} />
      </Suspense>
    </div>
  );
}

async function SharedInvoice({ params }: { params: Params }) {
  const { token } = await params;
  const shared = await getSharedInvoice(token);

  if (!shared) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-xl border bg-card p-10 text-center">
        <FileX className="size-8 text-muted-foreground" aria-hidden />
        <h1 className="text-xl">This invoice isn&rsquo;t available</h1>
        <p className="text-sm text-muted-foreground">
          The link may be mistyped or no longer valid. Please ask the sender for a new link.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-[52rem] flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <p className="text-sm text-muted-foreground">
          Invoice {shared.invoice.number} from <span className="font-medium text-foreground">{shared.sender.name}</span>
        </p>
        <PrintButton label="Print / Save as PDF" />
      </div>
      <InvoiceDocument invoice={shared.invoice} sender={shared.sender} />
    </div>
  );
}

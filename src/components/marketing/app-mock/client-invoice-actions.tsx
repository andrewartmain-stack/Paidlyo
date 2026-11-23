"use client";

import { Check, Download, Link2 } from "lucide-react";
import { useEffect, useState } from "react";
import { mockButton, mockButtonPrimary } from "./mock-parts";

export function ClientInvoiceActions() {
  const [done, setDone] = useState<"copied" | "pdf" | null>(null);

  useEffect(() => {
    if (!done) return;
    const id = setTimeout(() => setDone(null), 2000);
    return () => clearTimeout(id);
  }, [done]);

  async function copy() {
    try {
      await navigator.clipboard?.writeText("https://paidlyo.com/i/9fK2xQ");
    } catch {
      // Clipboard may be blocked; the mock still shows the state.
    }
    setDone("copied");
  }

  return (
    <div className="flex flex-wrap gap-2 pt-1" aria-live="polite">
      <button type="button" onClick={() => setDone("pdf")} className={mockButtonPrimary}>
        {done === "pdf" ? <Check className="size-3" aria-hidden /> : <Download className="size-3" aria-hidden />}
        {done === "pdf" ? "PDF ready" : "Download PDF"}
      </button>
      <button type="button" onClick={copy} className={mockButton}>
        {done === "copied" ? <Check className="size-3 text-brand" aria-hidden /> : <Link2 className="size-3" aria-hidden />}
        {done === "copied" ? "Copied" : "Copy link"}
      </button>
    </div>
  );
}

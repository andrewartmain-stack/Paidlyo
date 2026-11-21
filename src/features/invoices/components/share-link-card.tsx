"use client";

import { useState, useTransition } from "react";
import { Copy, ExternalLink, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { resetShareLink } from "../actions";

/** The no-login client link /i/<token>: copy, open, or reset it. Drafts aren't shared. */
export function ShareLinkCard({ invoiceId, url, isDraft }: { invoiceId: string; url: string; isDraft: boolean }) {
  const [confirmReset, setConfirmReset] = useState(false);
  const [pending, startTransition] = useTransition();

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied");
    } catch {
      toast.error("Couldn't copy. Select the link and copy it manually.");
    }
  }

  function reset() {
    if (!confirmReset) {
      setConfirmReset(true);
      return;
    }
    startTransition(async () => {
      const result = await resetShareLink(invoiceId);
      setConfirmReset(false);
      if (result.ok) toast.success("New link created. The old link no longer works.");
      else toast.error(result.error);
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Client link</CardTitle>
        <CardDescription>
          {isDraft
            ? "Mark the invoice as sent to share it. Your client can view and print it without logging in."
            : "Anyone with this link can view and print the invoice, no login needed."}
        </CardDescription>
      </CardHeader>
      {!isDraft && (
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            readOnly
            value={url}
            aria-label="Client link"
            onFocus={(e) => e.currentTarget.select()}
            className="font-mono text-xs sm:flex-1"
          />
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={copy}>
              <Copy aria-hidden />
              Copy link
            </Button>
            <a href={url} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: "outline" })}>
              <ExternalLink aria-hidden />
              Open
            </a>
            <Button
              type="button"
              variant={confirmReset ? "destructive" : "ghost"}
              disabled={pending}
              onClick={reset}
              onBlur={() => setConfirmReset(false)}
            >
              <RotateCcw aria-hidden />
              {confirmReset ? "Click again to reset" : "Reset link"}
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

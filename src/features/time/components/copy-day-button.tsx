"use client";

import { useTransition } from "react";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { copyDayEntries } from "../actions";

/** Empty day: copy the last day's entries (project, task, notes) at 0:00, ready to start timers. */
export function CopyDayButton({ fromDate, toDate, fromLabel }: { fromDate: string; toDate: string; fromLabel: string }) {
  const [pending, startTransition] = useTransition();

  function copy() {
    startTransition(async () => {
      const result = await copyDayEntries(fromDate, toDate);
      if (result.ok) toast.success(result.data.message);
      else toast.error(result.error);
    });
  }

  return (
    <Button type="button" variant="outline" onClick={copy} disabled={pending} className="mt-4">
      <Copy aria-hidden />
      {pending ? "Copying…" : `Copy from ${fromLabel}`}
    </Button>
  );
}

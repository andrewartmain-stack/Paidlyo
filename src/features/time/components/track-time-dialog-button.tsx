"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TrackableProject } from "../types";
import { TimeEntryDialog } from "./time-entry-dialog";

/** "Track time" on the timesheet. `?track=1` (from the sidebar button) opens it on load. */
export function TrackTimeDialogButton({
  projects,
  date,
  dateLabel,
  isToday,
}: {
  projects: TrackableProject[];
  date: string;
  dateLabel: string;
  isToday: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(searchParams.get("track") === "1");

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (!next && searchParams.has("track")) {
      const params = new URLSearchParams(searchParams);
      params.delete("track");
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    }
  }

  return (
    <>
      <Button size="lg" onClick={() => setOpen(true)}>
        <Timer aria-hidden />
        Track time
      </Button>
      <TimeEntryDialog
        open={open}
        onOpenChange={onOpenChange}
        projects={projects}
        date={date}
        dateLabel={dateLabel}
        isToday={isToday}
      />
    </>
  );
}

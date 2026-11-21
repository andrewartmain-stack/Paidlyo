import Link from "next/link";
import { Timer } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Primary sidebar action: opens the Track time dialog on today's timesheet. */
export function TrackTimeButton({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <Link
      href="/app/time?track=1"
      onClick={onNavigate}
      className={cn(buttonVariants(), "h-10 w-full focus-visible:ring-offset-sidebar")}
    >
      <Timer className="size-[1.125rem] transition-transform duration-300 motion-safe:group-hover/button:rotate-12" aria-hidden />
      Track time
    </Link>
  );
}

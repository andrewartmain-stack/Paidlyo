import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** Pale-green icon badge shown next to a page title. Decorative. */
export function PageIcon({ icon: Icon, className }: { icon: LucideIcon; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("hidden size-12 shrink-0 items-center justify-center rounded-2xl bg-accent text-brand sm:flex", className)}
    >
      <Icon className="size-6" strokeWidth={1.75} />
    </span>
  );
}

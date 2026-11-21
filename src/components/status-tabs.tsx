import Link from "next/link";
import { cn } from "@/lib/utils";

/** Active/Archived switch for list pages; each tab is a link so the view lives in the URL. */
export function StatusTabs({
  label,
  tabs,
}: {
  label: string;
  tabs: { href: string; label: string; active: boolean }[];
}) {
  return (
    <nav aria-label={label} className="flex w-fit gap-1 rounded-lg bg-muted p-1">
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          aria-current={tab.active ? "page" : undefined}
          className={cn(
            "rounded-md px-3 py-1 text-sm text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring",
            tab.active && "bg-card font-medium text-foreground ring-1 ring-border",
          )}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}

import Form from "next/form";
import Link from "next/link";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { ClientFilters } from "../schemas";

const TABS = [
  { status: "active", label: "Active" },
  { status: "archived", label: "Archived" },
] as const;

function tabHref(status: ClientFilters["status"], q: string) {
  const params = new URLSearchParams();
  if (status === "archived") params.set("status", status);
  if (q) params.set("q", q);
  const query = params.toString();
  return query ? `/app/clients?${query}` : "/app/clients";
}

/** Active/Archived tabs and name search, kept in the URL so views are shareable. */
export function ClientsFilters({ filters }: { filters: ClientFilters }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <nav aria-label="Client status" className="flex gap-1 rounded-lg bg-muted p-1">
        {TABS.map((tab) => {
          const active = filters.status === tab.status;
          return (
            <Link
              key={tab.status}
              href={tabHref(tab.status, filters.q)}
              aria-current={active ? "page" : undefined}
              className={cn(
                "rounded-md px-3 py-1 text-sm text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring",
                active && "bg-card font-medium text-foreground ring-1 ring-border",
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
      <Form action="/app/clients" role="search" className="relative sm:w-72">
        {filters.status === "archived" && <input type="hidden" name="status" value="archived" />}
        <Search
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          key={filters.q}
          name="q"
          type="search"
          defaultValue={filters.q}
          placeholder="Search clients"
          aria-label="Search clients by name"
          className="pl-9"
        />
      </Form>
    </div>
  );
}

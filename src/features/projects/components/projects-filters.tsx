"use client";

import Form from "next/form";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { projectsHref } from "../href";
import type { ProjectFilters } from "../schemas";

const ALL_CLIENTS = "all";

/** Client filter + name search; both stored in the URL. */
export function ProjectsFilters({
  filters,
  clients,
}: {
  filters: ProjectFilters;
  clients: { value: string; label: string }[];
}) {
  const router = useRouter();
  const items = [{ value: ALL_CLIENTS, label: "All clients" }, ...clients];

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <Select
        items={items}
        value={filters.client ?? ALL_CLIENTS}
        onValueChange={(value) => {
          const client = value && value !== ALL_CLIENTS ? String(value) : undefined;
          router.push(projectsHref({ ...filters, client }));
        }}
      >
        <SelectTrigger aria-label="Filter by client" className="w-full sm:w-56">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {items.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Form action="/app/projects" role="search" className="relative sm:w-72">
        {filters.status === "archived" && <input type="hidden" name="status" value="archived" />}
        {filters.client && <input type="hidden" name="client" value={filters.client} />}
        <Search
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          key={filters.q}
          name="q"
          type="search"
          defaultValue={filters.q}
          placeholder="Search projects"
          aria-label="Search projects by name"
          className="pl-9"
        />
      </Form>
    </div>
  );
}

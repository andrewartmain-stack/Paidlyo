import type { ProjectFilters } from "./schemas";

/** URL of the projects list for the given filters (used by server and client components). */
export function projectsHref(filters: Partial<ProjectFilters>) {
  const params = new URLSearchParams();
  if (filters.status === "archived") params.set("status", "archived");
  if (filters.client) params.set("client", filters.client);
  if (filters.q) params.set("q", filters.q);
  const query = params.toString();
  return query ? `/app/projects?${query}` : "/app/projects";
}

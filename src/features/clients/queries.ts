import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/features/organizations/queries";
import { escapeLike, type ClientFilters } from "./schemas";
import type { Client } from "./types";

/**
 * Clients of the current organization, filtered by status and name search.
 * Reads the session — call inside a <Suspense> boundary.
 */
export async function listClients(filters: ClientFilters): Promise<Client[]> {
  const org = await getCurrentOrg();
  const supabase = await createClient();

  let query = supabase
    .from("clients")
    .select("id, name, email, address, currency, archived_at, created_at")
    .eq("organization_id", org.id)
    .order("name");

  query =
    filters.status === "archived"
      ? query.not("archived_at", "is", null)
      : query.is("archived_at", null);

  if (filters.q) query = query.ilike("name", `%${escapeLike(filters.q)}%`);

  const { data, error } = await query;
  if (error) throw new Error("Could not load clients.");

  return data.map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    address: row.address,
    currency: row.currency,
    archivedAt: row.archived_at,
    createdAt: row.created_at,
  }));
}

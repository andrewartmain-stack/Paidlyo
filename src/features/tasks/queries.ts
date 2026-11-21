import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/features/organizations/queries";
import type { ArchiveStatus } from "@/lib/form-schemas";
import type { Task } from "./types";

/**
 * Tasks of the current organization, by archive status, sorted by name.
 * Reads the session — call inside a <Suspense> boundary.
 */
export async function listTasks(status: ArchiveStatus = "active"): Promise<Task[]> {
  const org = await getCurrentOrg();
  const supabase = await createClient();

  let query = supabase
    .from("tasks")
    .select("id, name, default_hourly_rate_cents, is_billable, is_common, archived_at")
    .eq("organization_id", org.id)
    .order("name");
  query = status === "archived" ? query.not("archived_at", "is", null) : query.is("archived_at", null);

  const { data, error } = await query;
  if (error) throw new Error("Could not load tasks.");

  return data.map((row) => ({
    id: row.id,
    name: row.name,
    defaultHourlyRateCents: row.default_hourly_rate_cents,
    isBillable: row.is_billable,
    isCommon: row.is_common,
    archivedAt: row.archived_at,
  }));
}

import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

/**
 * Supabase client with the SECRET key. Bypasses Row Level Security.
 * Use ONLY for trusted server work with no user session (e.g. Stripe webhooks).
 * Never import this from client code or use it for normal user requests.
 */
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

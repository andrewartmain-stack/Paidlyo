import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/supabase";

/** Supabase client for Client Components. Uses the public (RLS-protected) key. */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}

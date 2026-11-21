import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";

export type CurrentUser = {
  id: string;
  email: string;
  fullName: string;
};

/**
 * The signed-in user (Data Access Layer). Redirects to /login when signed out.
 * Reads cookies, so call it inside a <Suspense> boundary (Cache Components).
 * Deduplicated per request with React `cache`.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser> => {
  // Session checks compare token expiry with Date.now(); with partial prefetching Next would
  // otherwise run them while prerendering (cookies available) and flag the unstable time read.
  await connection();
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", claims.sub)
    .maybeSingle();

  return {
    id: claims.sub,
    email: profile?.email ?? claims.email ?? "",
    fullName: profile?.full_name ?? "",
  };
});

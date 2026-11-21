import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/features/auth/redirect";

/**
 * Return URL for "Continue with Google" and for the links in Supabase's default
 * confirm-signup / reset-password emails. Exchanges the one-time code for a session, then
 * redirects. New users continue to onboarding and the free trial from /app.
 */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const next = safeNext(request.nextUrl.searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, request.url));
  }

  // Cancelled at the provider, an expired code, or a provider that isn't set up.
  return NextResponse.redirect(new URL("/login?error=oauth", request.url));
}

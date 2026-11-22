import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/supabase";
import { safeNext } from "@/features/auth/redirect";

/** Pages that require a signed-in user. */
const PROTECTED = ["/app", "/onboarding", "/subscribe"];

/** Pages only for signed-out users; signed-in users are sent to the dashboard. */
const GUEST_ONLY = ["/login", "/signup", "/forgot-password"];

/**
 * Refreshes the Supabase session cookie and applies auth redirects.
 * Optimistic check only — pages and Server Actions still verify the user,
 * and RLS is the real authorization layer.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Do not add code between createServerClient and getClaims(): it refreshes the session.
  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims);
  const { pathname, search } = request.nextUrl;

  const isProtected = PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (!signedIn && isProtected) {
    return redirectWithCookies(request, response, "/login", { next: pathname + search });
  }

  if (signedIn && GUEST_ONLY.includes(pathname)) {
    const next = new URL(safeNext(request.nextUrl.searchParams.get("next")), request.url);
    return redirectWithCookies(request, response, next.pathname, Object.fromEntries(next.searchParams));
  }

  return response;
}

/** Redirect while keeping any refreshed session cookies. */
function redirectWithCookies(
  request: NextRequest,
  response: NextResponse,
  pathname: string,
  params: Record<string, string> = {},
) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = new URLSearchParams(params).toString();
  const redirect = NextResponse.redirect(url);
  response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  return redirect;
}

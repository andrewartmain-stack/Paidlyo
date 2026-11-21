import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

// Only routes that use the session. Marketing pages stay static and skip the proxy.
export const config = {
  matcher: [
    "/app/:path*",
    "/onboarding",
    "/subscribe",
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
    "/auth/:path*",
  ],
};

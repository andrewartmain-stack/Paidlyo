import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/features/auth/redirect";

const paramsSchema = z.object({
  token_hash: z.string().min(1),
  type: z.enum(["email", "signup", "recovery", "invite", "magiclink", "email_change"]),
  next: z.string().optional(),
});

/**
 * Landing URL for links in Supabase auth emails (confirm signup, reset password).
 * Verifies the one-time token, which signs the user in, then redirects.
 * Email templates: see docs/DEVELOPMENT.md.
 */
export async function GET(request: NextRequest) {
  const parsed = paramsSchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));

  if (parsed.success) {
    const { token_hash, type, next } = parsed.data;
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ token_hash, type });
    if (!error) {
      return NextResponse.redirect(new URL(safeNext(next), request.url));
    }
  }

  return NextResponse.redirect(new URL("/login?error=link", request.url));
}

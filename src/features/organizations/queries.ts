import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/features/auth/queries";
import type { CurrentOrg } from "./types";

export const LOGO_BUCKET = "org-logos";

export function logoPublicUrl(path: string | null): string | null {
  if (!path) return null;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${LOGO_BUCKET}/${path}`;
}

/** The user's organization, or null if they haven't created one yet. */
export const findCurrentOrg = cache(async (): Promise<CurrentOrg | null> => {
  const user = await getCurrentUser();
  const supabase = await createClient();

  // MVP: one organization per user — take the first membership.
  const { data } = await supabase
    .from("organization_members")
    .select("role, organization:organizations(*)")
    .eq("user_id", user.id)
    .order("created_at")
    .limit(1)
    .maybeSingle();

  const org = data?.organization;
  if (!data || !org) return null;

  return {
    id: org.id,
    name: org.name,
    address: org.address,
    currency: org.currency,
    timezone: org.timezone,
    defaultTaxRate: Number(org.default_tax_rate),
    invoicePrefix: org.invoice_prefix,
    nextInvoiceNumber: org.next_invoice_number,
    logoPath: org.logo_path,
    logoUrl: logoPublicUrl(org.logo_path),
    role: data.role,
  };
});

/**
 * The user's organization (Data Access Layer). Redirects to /onboarding if there is none.
 * Reads the session — call inside a <Suspense> boundary.
 */
export async function getCurrentOrg(): Promise<CurrentOrg> {
  const org = await findCurrentOrg();
  if (!org) redirect("/onboarding");
  return org;
}

export function canManageOrg(org: CurrentOrg): boolean {
  return org.role === "owner" || org.role === "admin";
}

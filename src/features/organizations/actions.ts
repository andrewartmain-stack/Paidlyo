"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import { canManageOrg, findCurrentOrg, getCurrentOrg, LOGO_BUCKET } from "./queries";
import {
  createOrganizationSchema,
  LOGO_TYPES,
  updateOrganizationSchema,
  validateLogo,
} from "./schemas";

const NOT_ALLOWED = "Only owners and admins can change organization settings.";
const GENERIC_ERROR = "Something went wrong. Please try again.";

function invalid(error: z.ZodError) {
  return fail("Please fix the highlighted fields.", z.flattenError(error).fieldErrors);
}

export async function createOrganization(formData: FormData): Promise<ActionResult> {
  const parsed = createOrganizationSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(parsed.error);

  // Double submit or a stale tab: the user already has an organization.
  if (await findCurrentOrg()) redirect("/app");

  const supabase = await createClient();
  const { error } = await supabase.rpc("create_organization", {
    p_name: parsed.data.name,
    p_currency: parsed.data.currency,
    p_timezone: parsed.data.timezone,
  });
  if (error) {
    if (error.hint === "already_member") redirect("/app");
    return fail(GENERIC_ERROR);
  }

  // New organizations start their (card-required) free trial next.
  redirect("/subscribe");
}

export async function updateOrganization(formData: FormData): Promise<ActionResult> {
  const parsed = updateOrganizationSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(parsed.error);

  const org = await getCurrentOrg();
  if (!canManageOrg(org)) return fail(NOT_ALLOWED);

  const v = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase
    .from("organizations")
    .update({
      name: v.name,
      address: v.address,
      currency: v.currency,
      timezone: v.timezone,
      default_tax_rate: v.defaultTaxRate,
      invoice_prefix: v.invoicePrefix,
      next_invoice_number: v.nextInvoiceNumber,
    })
    .eq("id", org.id);
  if (error) return fail(GENERIC_ERROR);

  revalidatePath("/app", "layout");
  return ok();
}

export async function uploadLogo(formData: FormData): Promise<ActionResult> {
  const file = formData.get("logo");
  const problem = validateLogo(file);
  if (problem || !(file instanceof File)) return fail(problem ?? GENERIC_ERROR);

  const org = await getCurrentOrg();
  if (!canManageOrg(org)) return fail(NOT_ALLOWED);

  // New name per upload so CDN/browser caches never show the old logo.
  const path = `${org.id}/logo-${Date.now()}.${LOGO_TYPES[file.type]}`;
  const supabase = await createClient();

  const { error: uploadError } = await supabase.storage
    .from(LOGO_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (uploadError) return fail("Upload failed. Please try again.");

  const { error } = await supabase.from("organizations").update({ logo_path: path }).eq("id", org.id);
  if (error) {
    await supabase.storage.from(LOGO_BUCKET).remove([path]);
    return fail(GENERIC_ERROR);
  }

  if (org.logoPath) await supabase.storage.from(LOGO_BUCKET).remove([org.logoPath]);

  revalidatePath("/app", "layout");
  return ok();
}

export async function removeLogo(): Promise<ActionResult> {
  const org = await getCurrentOrg();
  if (!canManageOrg(org)) return fail(NOT_ALLOWED);
  if (!org.logoPath) return ok();

  const supabase = await createClient();
  const { error } = await supabase.from("organizations").update({ logo_path: null }).eq("id", org.id);
  if (error) return fail(GENERIC_ERROR);

  await supabase.storage.from(LOGO_BUCKET).remove([org.logoPath]);

  revalidatePath("/app", "layout");
  return ok();
}

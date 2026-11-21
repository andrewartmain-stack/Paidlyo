"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import { fieldErrorsByPath } from "@/lib/form-schemas";
import { writeBlocked } from "@/features/billing/guard";
import { canManageOrg, getCurrentOrg } from "@/features/organizations/queries";
import {
  invoiceFormSchema,
  invoiceIdSchema,
  invoiceSourceSchema,
  newInvoiceSchema,
  paymentFormSchema,
  paymentIdSchema,
  unbilledTimeSchema,
  statusActionSchema,
  type InvoiceFormInput,
  type StatusAction,
} from "./schemas";

const NOT_ALLOWED = "Only owners and admins can manage invoices.";
const NOT_FOUND = "This invoice no longer exists.";
const NOT_DRAFT = "Only draft invoices can be changed. Revert it to a draft first.";
const GENERIC_ERROR = "Something went wrong. Please try again.";
const FIX_FIELDS = "Please fix the highlighted fields.";

async function managedOrg() {
  const org = await getCurrentOrg();
  return canManageOrg(org) ? org : null;
}

function revalidate(id?: string) {
  revalidatePath("/app/invoices");
  if (id) revalidatePath(`/app/invoices/${id}`);
}

const NO_UNBILLED_TIME = "There's no unbilled billable time for this client in that period.";

type SupabaseServer = Awaited<ReturnType<typeof createClient>>;

/** Adds the client's unbilled time as lines; returns an error message or null. */
async function addTime(
  supabase: SupabaseServer,
  invoiceId: string,
  options: { from: string | null; to: string | null; grouping: string },
): Promise<string | null> {
  const { error } = await supabase.rpc("add_time_to_invoice", {
    p_invoice_id: invoiceId,
    p_from: options.from,
    p_to: options.to,
    p_grouping: options.grouping,
  });
  if (!error) return null;
  if (error.hint === "no_unbilled_time") return NO_UNBILLED_TIME;
  if (error.hint === "not_draft") return NOT_DRAFT;
  if (error.hint === "not_found") return NOT_FOUND;
  return GENERIC_ERROR;
}

export async function createInvoice(formData: FormData): Promise<ActionResult> {
  const fields = Object.fromEntries(formData);
  const parsed = newInvoiceSchema.safeParse(fields);
  if (!parsed.success) return fail(FIX_FIELDS, z.flattenError(parsed.error).fieldErrors);
  const source = invoiceSourceSchema.parse(fields.source);
  const time = source === "time" ? unbilledTimeSchema.safeParse(fields) : null;
  if (time && !time.success) return fail(FIX_FIELDS, z.flattenError(time.error).fieldErrors);

  const org = await managedOrg();
  if (!org) return fail(NOT_ALLOWED);
  const blocked = await writeBlocked(org.id);
  if (blocked) return fail(blocked);

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_invoice", {
    p_organization_id: org.id,
    p_client_id: parsed.data.clientId,
    p_issue_date: parsed.data.issueDate,
    p_due_date: parsed.data.dueDate,
  });
  if (error) {
    if (error.hint === "client_not_found") return fail(FIX_FIELDS, { clientId: ["Choose an active client."] });
    if (error.hint === "not_allowed") return fail(NOT_ALLOWED);
    return fail(GENERIC_ERROR);
  }

  // The draft exists either way; if adding time fails, say so on the editor rather than losing it.
  if (time?.success) {
    const timeError = await addTime(supabase, data, time.data);
    if (timeError) {
      revalidate();
      redirect(`/app/invoices/${data}?notice=${timeError === NO_UNBILLED_TIME ? "no-time" : "time-error"}`);
    }
  }

  revalidate();
  redirect(`/app/invoices/${data}`);
}

/** Editor: add the client's unbilled time to a draft. */
export async function addUnbilledTime(id: string, formData: FormData): Promise<ActionResult> {
  const invoiceId = invoiceIdSchema.safeParse(id);
  if (!invoiceId.success) return fail(NOT_FOUND);
  const parsed = unbilledTimeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail(FIX_FIELDS, z.flattenError(parsed.error).fieldErrors);

  const org = await managedOrg();
  if (!org) return fail(NOT_ALLOWED);
  const blocked = await writeBlocked(org.id);
  if (blocked) return fail(blocked);

  const supabase = await createClient();
  const timeError = await addTime(supabase, invoiceId.data, parsed.data);
  if (timeError) return fail(timeError);

  revalidate(invoiceId.data);
  revalidatePath("/app/time");
  return ok();
}

/** Saves a draft's details and lines; the database recalculates and stores the totals. */
export async function saveInvoice(id: string, input: InvoiceFormInput): Promise<ActionResult> {
  const invoiceId = invoiceIdSchema.safeParse(id);
  if (!invoiceId.success) return fail(NOT_FOUND);
  const parsed = invoiceFormSchema.safeParse(input);
  if (!parsed.success) return fail(FIX_FIELDS, fieldErrorsByPath(parsed.error));

  const org = await managedOrg();
  if (!org) return fail(NOT_ALLOWED);
  const blocked = await writeBlocked(org.id);
  if (blocked) return fail(blocked);

  const v = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.rpc("save_invoice", {
    p_invoice_id: invoiceId.data,
    p_invoice: {
      number: v.number,
      issue_date: v.issueDate,
      due_date: v.dueDate,
      subject: v.subject,
      notes: v.notes,
      discount_rate: v.discountRate,
      tax_rate: v.taxRate,
    },
    p_items: v.items.map((item) => ({
      id: item.id,
      description: item.description,
      quantity: item.quantity,
      unit_price_cents: item.unitPrice,
    })),
  });
  if (error) {
    if (error.code === "23505") return fail(FIX_FIELDS, { number: ["This invoice number is already used."] });
    if (error.hint === "not_found" || error.hint === "item_not_found") return fail(NOT_FOUND);
    if (error.hint === "not_draft") return fail(NOT_DRAFT);
    return fail(GENERIC_ERROR);
  }

  revalidate(invoiceId.data);
  // Removing a time line makes its entries unbilled again.
  revalidatePath("/app/time");
  return ok();
}

const STATUS_MESSAGES: Record<string, string> = {
  no_items: "Add at least one line before sending.",
  invalid_transition: "This status change isn't allowed any more. Reload the page.",
  not_found: NOT_FOUND,
};

export async function changeInvoiceStatus(id: string, action: StatusAction): Promise<ActionResult> {
  const invoiceId = invoiceIdSchema.safeParse(id);
  const parsedAction = statusActionSchema.safeParse(action);
  if (!invoiceId.success || !parsedAction.success) return fail(NOT_FOUND);

  const org = await managedOrg();
  if (!org) return fail(NOT_ALLOWED);
  const blocked = await writeBlocked(org.id);
  if (blocked) return fail(blocked);

  const supabase = await createClient();
  const { error } = await supabase.rpc("set_invoice_status", {
    p_invoice_id: invoiceId.data,
    p_action: parsedAction.data,
  });
  if (error) return fail((error.hint && STATUS_MESSAGES[error.hint]) || GENERIC_ERROR);

  revalidate(invoiceId.data);
  revalidatePath("/app/time");
  return ok();
}

export async function deleteInvoice(id: string): Promise<ActionResult> {
  const invoiceId = invoiceIdSchema.safeParse(id);
  if (!invoiceId.success) return fail(NOT_FOUND);

  const org = await managedOrg();
  if (!org) return fail(NOT_ALLOWED);
  const blocked = await writeBlocked(org.id);
  if (blocked) return fail(blocked);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("invoices")
    .delete()
    .eq("id", invoiceId.data)
    .eq("organization_id", org.id)
    .eq("status", "draft")
    .select("id")
    .maybeSingle();
  if (error) return fail(GENERIC_ERROR);
  if (!data) return fail("Only draft invoices can be deleted.");

  revalidate();
  revalidatePath("/app/time");
  redirect("/app/invoices");
}

/** New client link; the old one stops working. */
export async function resetShareLink(id: string): Promise<ActionResult> {
  const invoiceId = invoiceIdSchema.safeParse(id);
  if (!invoiceId.success) return fail(NOT_FOUND);

  const org = await managedOrg();
  if (!org) return fail(NOT_ALLOWED);

  const supabase = await createClient();
  const { error } = await supabase.rpc("reset_invoice_share_token", { p_invoice_id: invoiceId.data });
  if (error) return fail(error.hint === "not_found" ? NOT_FOUND : GENERIC_ERROR);

  revalidate(invoiceId.data);
  return ok();
}

/** Records a payment by hand; the database updates the amount paid and the status. */
export async function recordPayment(id: string, formData: FormData): Promise<ActionResult> {
  const invoiceId = invoiceIdSchema.safeParse(id);
  if (!invoiceId.success) return fail(NOT_FOUND);
  const parsed = paymentFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail(FIX_FIELDS, z.flattenError(parsed.error).fieldErrors);

  const org = await managedOrg();
  if (!org) return fail(NOT_ALLOWED);
  const blocked = await writeBlocked(org.id);
  if (blocked) return fail(blocked);

  const v = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.rpc("record_payment", {
    p_invoice_id: invoiceId.data,
    p_amount_cents: v.amount,
    p_paid_at: v.paidAt,
    p_method: v.method,
    p_notes: v.notes,
  });
  if (error) {
    if (error.hint === "overpayment") {
      return fail(FIX_FIELDS, { amount: ["That's more than the amount due."] });
    }
    if (error.hint === "not_open") return fail("Payments can only be recorded on sent invoices.");
    if (error.hint === "not_found") return fail(NOT_FOUND);
    return fail(GENERIC_ERROR);
  }

  revalidate(invoiceId.data);
  return ok();
}

/** Removes a payment recorded by mistake; the status goes back accordingly. */
export async function deletePayment(invoiceId: string, paymentId: string): Promise<ActionResult> {
  const ids = z.object({ invoiceId: invoiceIdSchema, paymentId: paymentIdSchema }).safeParse({ invoiceId, paymentId });
  if (!ids.success) return fail("This payment no longer exists.");

  const org = await managedOrg();
  if (!org) return fail(NOT_ALLOWED);
  const blocked = await writeBlocked(org.id);
  if (blocked) return fail(blocked);

  const supabase = await createClient();
  const { error } = await supabase.rpc("delete_payment", { p_payment_id: ids.data.paymentId });
  if (error) {
    if (error.hint === "invoice_void") return fail("Payments on a void invoice can't be changed.");
    if (error.hint === "not_found") return fail("This payment no longer exists.");
    return fail(GENERIC_ERROR);
  }

  revalidate(ids.data.invoiceId);
  return ok();
}

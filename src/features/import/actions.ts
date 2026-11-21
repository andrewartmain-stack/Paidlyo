"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import { writeBlocked } from "@/features/billing/guard";
import { canManageOrg, getCurrentOrg } from "@/features/organizations/queries";
import { MAX_IMPORT_BYTES, parseHarvestCsv } from "./harvest";
import { buildImportPlan, type ImportPlan, type ImportPreview } from "./plan";
import { loadExistingData } from "./queries";

const NOT_ALLOWED = "Only owners and admins can import data.";
const GENERIC_ERROR = "Something went wrong. Please try again.";
/** Rows with problems shown in the preview; the rest are only counted. */
const MAX_SHOWN_ERRORS = 100;

async function preparePlan(formData: FormData): Promise<ActionResult<{ orgId: string; plan: ImportPlan }>> {
  const org = await getCurrentOrg();
  if (!canManageOrg(org)) return fail(NOT_ALLOWED);
  const blocked = await writeBlocked(org.id);
  if (blocked) return fail(blocked);

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return fail("Choose your Harvest CSV file.", { file: ["Choose a file."] });
  if (file.size > MAX_IMPORT_BYTES) {
    return fail("The file is larger than 5 MB.", { file: ["Export a shorter period, for example one year."] });
  }

  const parsed = parseHarvestCsv(await file.text());
  if (!parsed.ok) return fail(parsed.error, { file: [parsed.error] });

  const existing = await loadExistingData(org.id);
  const plan = buildImportPlan(
    parsed.rows,
    parsed.errors,
    existing,
    { includeInvoiced: formData.get("includeInvoiced") === "on", orgCurrency: org.currency },
    randomUUID,
  );
  return ok({ orgId: org.id, plan });
}

/** The preview sent to the browser: the full counts, with the problem list capped. */
export type ImportPreviewResult = ImportPreview & { errorCount: number };

function forBrowser(preview: ImportPreview): ImportPreviewResult {
  return { ...preview, errors: preview.errors.slice(0, MAX_SHOWN_ERRORS), errorCount: preview.errors.length };
}

/** Step 1: parse the file and show what would be imported. Nothing is saved. */
export async function previewHarvestImport(formData: FormData): Promise<ActionResult<ImportPreviewResult>> {
  try {
    const prepared = await preparePlan(formData);
    if (!prepared.ok) return prepared;
    return ok(forBrowser(prepared.data.plan.preview));
  } catch {
    return fail(GENERIC_ERROR);
  }
}

/**
 * Step 2: import the same file. It is parsed and compared again (nothing is kept between the
 * steps), then saved in one transaction by import_harvest.
 */
export async function runHarvestImport(formData: FormData): Promise<ActionResult<{ imported: number }>> {
  let prepared;
  try {
    prepared = await preparePlan(formData);
  } catch {
    return fail(GENERIC_ERROR);
  }
  if (!prepared.ok) return prepared;
  const { orgId, plan } = prepared.data;
  if (plan.preview.newEntries === 0) return fail("There's nothing new to import from this file.");

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("import_harvest", { p_organization_id: orgId, p_payload: plan.payload });
  if (error) {
    if (error.hint === "not_allowed") return fail(NOT_ALLOWED);
    if (error.hint === "project_archived") return fail("A project in the file was archived meanwhile. Preview again.");
    return fail("The import failed and nothing was saved. Please try again.");
  }

  const imported = typeof data === "object" && data && "imported" in data ? Number(data.imported) : plan.preview.newEntries;
  for (const path of ["/app/clients", "/app/projects", "/app/tasks", "/app/time", "/app/reports"]) {
    revalidatePath(path, "layout");
  }
  return ok({ imported });
}

import { z } from "zod";
import { toCents } from "./money";

/** Largest amount we accept from a form (cents): 100 million in any currency. */
export const MAX_AMOUNT_CENTS = 10_000_000_000;

/** Optional money input ("120", "1,250.50") → integer cents, or null when blank. */
export const optionalAmountCents = z
  .string()
  .trim()
  .transform((value, ctx) => {
    if (value === "") return null;
    const cents = toCents(value);
    if (cents === null || cents < 0) {
      ctx.addIssue({ code: "custom", message: "Enter an amount like 120 or 95.50." });
      return z.NEVER;
    }
    if (cents > MAX_AMOUNT_CENTS) {
      ctx.addIssue({ code: "custom", message: "Amount is too large." });
      return z.NEVER;
    }
    return cents;
  });

/** HTML checkbox: present ("on") → true, missing → false. */
export const checkbox = z
  .literal(["on", "true"])
  .optional()
  .transform((v) => v !== undefined);

/** Optional text input → trimmed string, or null when blank. */
export const optionalText = (max: number, message = "This is too long.") =>
  z
    .string()
    .trim()
    .max(max, message)
    .transform((v) => (v === "" ? null : v));

export const ARCHIVE_STATUSES = ["active", "archived"] as const;
export type ArchiveStatus = (typeof ARCHIVE_STATUSES)[number];
export const archiveStatusSchema = z.enum(ARCHIVE_STATUSES).catch("active");

/** Formats cents for a money input's default value: 12050 → "120.50", 12000 → "120". */
export function centsToInput(cents: number | null): string {
  if (cents === null) return "";
  return cents % 100 === 0 ? String(cents / 100) : (cents / 100).toFixed(2);
}

/** Escapes LIKE wildcards so user search text matches literally. */
export function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (c) => `\\${c}`);
}

/**
 * Field errors keyed by full path ("items.2.quantity"), for forms with nested fields where
 * z.flattenError (top-level keys only) isn't enough.
 */
export function fieldErrorsByPath(error: z.ZodError): Record<string, string[]> {
  const errors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_form";
    (errors[key] ??= []).push(issue.message);
  }
  return errors;
}

/** "20", "7.5", "7,25" → hundredths of a percent as an integer-safe number (20 → 20, 7.5 → 7.5). */
export const percentInput = z
  .string()
  .trim()
  .transform((v) => (v === "" ? "0" : v.replace(",", ".")))
  .pipe(
    z
      .string()
      .regex(/^\d{1,3}(\.\d{1,2})?$/, "Enter a percentage like 20 or 7.5.")
      .transform(Number)
      .pipe(z.number().max(100, "Can't be above 100%.")),
  );

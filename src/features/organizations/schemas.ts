import { z } from "zod";

/** Shown first in the currency picker. */
const COMMON_CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD"];

export function currencyCodes(): string[] {
  const all = Intl.supportedValuesOf("currency");
  return [...COMMON_CURRENCIES, ...all.filter((c) => !COMMON_CURRENCIES.includes(c))];
}

export function timeZones(): string[] {
  return ["UTC", ...Intl.supportedValuesOf("timeZone").filter((tz) => tz !== "UTC")];
}

export function isValidTimeZone(value: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

const name = z.string().trim().min(1, "Enter your company name.").max(120, "Name is too long.");

const currency = z
  .string()
  .trim()
  .toUpperCase()
  .refine((c) => currencyCodes().includes(c), "Choose a currency.");

const timezone = z.string().trim().refine(isValidTimeZone, "Choose a timezone.");

export const createOrganizationSchema = z.object({ name, currency, timezone });

export const updateOrganizationSchema = z.object({
  name,
  address: z.string().trim().max(500, "Address is too long."),
  currency,
  timezone,
  defaultTaxRate: z
    .string()
    .trim()
    .regex(/^\d{1,3}([.,]\d{1,2})?$/, "Enter a percentage like 20 or 7.5.")
    .transform((v) => Number(v.replace(",", ".")))
    .pipe(z.number().min(0).max(100, "Tax rate can't be above 100%.")),
  invoicePrefix: z
    .string()
    .trim()
    .max(10, "Use at most 10 characters.")
    .regex(/^[A-Za-z0-9\-_/#.]*$/, "Use letters, numbers and - _ / # . only."),
  nextInvoiceNumber: z
    .string()
    .trim()
    .regex(/^\d+$/, "Enter a whole number.")
    .transform(Number)
    .pipe(z.number().int().min(1, "Must be 1 or more.").max(999_999_999, "Number is too large.")),
});

export const LOGO_MAX_BYTES = 1024 * 1024;
export const LOGO_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

/** Returns an error message, or null when the file is an acceptable logo. */
export function validateLogo(file: unknown): string | null {
  if (!(file instanceof File) || file.size === 0) return "Choose an image to upload.";
  if (!(file.type in LOGO_TYPES)) return "Use a PNG, JPG or WebP image.";
  if (file.size > LOGO_MAX_BYTES) return "The image must be 1 MB or smaller.";
  return null;
}

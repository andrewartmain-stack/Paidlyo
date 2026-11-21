/**
 * Money is always stored and calculated as integer minor units (cents).
 * Never use floats for money. Convert only at the edges (input parsing, display).
 */

/** Parse a user-entered amount like "1,234.50" into cents. Returns null if invalid. */
export function toCents(input: string): number | null {
  const normalized = input.replace(/[\s,]/g, "");
  if (!/^-?\d+(\.\d{1,2})?$/.test(normalized)) return null;
  const [whole, fraction = ""] = normalized.replace("-", "").split(".");
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  return normalized.startsWith("-") ? -cents : cents;
}

/** Format cents for display, e.g. formatMoney(123450, "USD") -> "$1,234.50". */
export function formatMoney(cents: number, currency: string, locale = "en-US") {
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(
    cents / 100,
  );
}

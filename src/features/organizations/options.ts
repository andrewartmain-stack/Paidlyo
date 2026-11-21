import type { SelectOption } from "@/components/form-field";
import { currencyCodes, timeZones } from "./schemas";

// Build on the server and pass to client forms, so labels match between SSR and hydration.

export function currencyOptions(): SelectOption[] {
  const names = new Intl.DisplayNames(["en"], { type: "currency" });
  return currencyCodes().map((code) => ({ value: code, label: `${code} — ${names.of(code) ?? code}` }));
}

export function timeZoneOptions(): SelectOption[] {
  return timeZones().map((tz) => ({ value: tz, label: tz.replaceAll("_", " ") }));
}

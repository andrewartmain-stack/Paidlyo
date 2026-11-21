import { describe, expect, it } from "vitest";
import {
  createOrganizationSchema,
  currencyCodes,
  isValidTimeZone,
  timeZones,
  updateOrganizationSchema,
  validateLogo,
} from "@/features/organizations/schemas";

const validSettings = {
  name: "Acme Studio",
  address: "1 Main St\nSpringfield",
  currency: "eur",
  timezone: "Europe/Bucharest",
  defaultTaxRate: "19",
  invoicePrefix: "INV-",
  nextInvoiceNumber: "42",
};

describe("currency and timezone lists", () => {
  it("puts common currencies first without duplicates", () => {
    const codes = currencyCodes();
    expect(codes.slice(0, 3)).toEqual(["USD", "EUR", "GBP"]);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it("includes UTC first and validates timezones", () => {
    expect(timeZones()[0]).toBe("UTC");
    expect(isValidTimeZone("America/New_York")).toBe(true);
    expect(isValidTimeZone("Mars/Olympus")).toBe(false);
  });
});

describe("createOrganizationSchema", () => {
  it("normalises currency and trims the name", () => {
    const result = createOrganizationSchema.parse({ name: "  Acme ", currency: "usd", timezone: "UTC" });
    expect(result).toEqual({ name: "Acme", currency: "USD", timezone: "UTC" });
  });

  it("rejects unknown currencies and empty names", () => {
    expect(createOrganizationSchema.safeParse({ name: "Acme", currency: "XYZ1", timezone: "UTC" }).success).toBe(false);
    expect(createOrganizationSchema.safeParse({ name: " ", currency: "USD", timezone: "UTC" }).success).toBe(false);
  });
});

describe("updateOrganizationSchema", () => {
  it("parses numbers from form strings", () => {
    const result = updateOrganizationSchema.parse(validSettings);
    expect(result.defaultTaxRate).toBe(19);
    expect(result.nextInvoiceNumber).toBe(42);
    expect(result.currency).toBe("EUR");
  });

  it("accepts decimal tax with a comma", () => {
    expect(updateOrganizationSchema.parse({ ...validSettings, defaultTaxRate: "7,5" }).defaultTaxRate).toBe(7.5);
  });

  it.each([
    ["defaultTaxRate", "101"],
    ["defaultTaxRate", "-1"],
    ["defaultTaxRate", "abc"],
    ["defaultTaxRate", "1.234"],
    ["nextInvoiceNumber", "0"],
    ["nextInvoiceNumber", "1.5"],
    ["invoicePrefix", "TOO-LONG-PREFIX"],
    ["invoicePrefix", "<b>"],
  ])("rejects %s = %j", (field, value) => {
    expect(updateOrganizationSchema.safeParse({ ...validSettings, [field]: value }).success).toBe(false);
  });
});

describe("validateLogo", () => {
  it("accepts small PNG/JPG/WebP files", () => {
    expect(validateLogo(new File(["x"], "logo.png", { type: "image/png" }))).toBeNull();
  });

  it("rejects SVG, empty and oversized files", () => {
    expect(validateLogo(new File(["<svg/>"], "logo.svg", { type: "image/svg+xml" }))).not.toBeNull();
    expect(validateLogo(new File([], "logo.png", { type: "image/png" }))).not.toBeNull();
    expect(validateLogo(new File([new Uint8Array(1024 * 1024 + 1)], "big.png", { type: "image/png" }))).not.toBeNull();
    expect(validateLogo("not a file")).not.toBeNull();
  });
});

import { describe, expect, it } from "vitest";
import { formatMoney, toCents } from "@/lib/money";

describe("toCents", () => {
  it("parses whole and decimal amounts", () => {
    expect(toCents("12")).toBe(1200);
    expect(toCents("12.5")).toBe(1250);
    expect(toCents("1,234.56")).toBe(123456);
    expect(toCents("-3.10")).toBe(-310);
  });

  it("rejects invalid input", () => {
    expect(toCents("")).toBeNull();
    expect(toCents("abc")).toBeNull();
    expect(toCents("1.234")).toBeNull();
  });
});

describe("formatMoney", () => {
  it("formats cents as currency", () => {
    expect(formatMoney(123450, "USD")).toBe("$1,234.50");
  });
});

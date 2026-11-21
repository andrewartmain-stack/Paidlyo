import { describe, expect, it } from "vitest";
import { z } from "zod";
import { clientFiltersSchema, clientIdSchema, clientSchema, escapeLike } from "@/features/clients/schemas";

const valid = { name: " Acme Ltd ", email: "", address: "", currency: "eur" };

describe("clientSchema", () => {
  it("trims, normalises currency and stores empty optionals as null", () => {
    expect(clientSchema.parse(valid)).toEqual({
      name: "Acme Ltd",
      email: null,
      address: null,
      currency: "EUR",
    });
  });

  it("lowercases a valid email", () => {
    expect(clientSchema.parse({ ...valid, email: " Billing@Acme.COM " }).email).toBe("billing@acme.com");
  });

  it("rejects a missing name, a bad email and an unknown currency", () => {
    const result = clientSchema.safeParse({ name: "  ", email: "nope", address: "", currency: "XYZ1" });
    expect(result.success).toBe(false);
    const fields = Object.keys(z.flattenError(result.error!).fieldErrors);
    expect(fields).toEqual(expect.arrayContaining(["name", "email", "currency"]));
  });

  it("rejects overly long values", () => {
    expect(clientSchema.safeParse({ ...valid, name: "a".repeat(201) }).success).toBe(false);
    expect(clientSchema.safeParse({ ...valid, address: "a".repeat(1001) }).success).toBe(false);
  });
});

describe("clientIdSchema", () => {
  it("accepts UUIDs only", () => {
    expect(clientIdSchema.safeParse("6f1c2b4e-8d3a-4c7e-9b2f-1a2b3c4d5e6f").success).toBe(true);
    expect(clientIdSchema.safeParse("1 or 1=1").success).toBe(false);
  });
});

describe("clientFiltersSchema", () => {
  it("defaults to active with no search", () => {
    expect(clientFiltersSchema.parse({})).toEqual({ status: "active", q: "" });
  });

  it("falls back on invalid values instead of failing", () => {
    expect(clientFiltersSchema.parse({ status: "deleted", q: ["a", "b"] })).toEqual({
      status: "active",
      q: "",
    });
    expect(clientFiltersSchema.parse({ status: "archived", q: " acme " })).toEqual({
      status: "archived",
      q: "acme",
    });
  });
});

describe("escapeLike", () => {
  it("escapes LIKE wildcards", () => {
    expect(escapeLike("50%_off\\")).toBe("50\\%\\_off\\\\");
  });
});

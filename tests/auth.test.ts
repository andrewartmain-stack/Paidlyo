import { describe, expect, it } from "vitest";
import { safeNext } from "@/features/auth/redirect";
import {
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
} from "@/features/auth/schemas";

describe("safeNext", () => {
  it("keeps same-site paths", () => {
    expect(safeNext("/app/invoices?status=draft")).toBe("/app/invoices?status=draft");
  });

  it.each([
    ["//evil.com"],
    ["/\\evil.com"],
    ["https://evil.com"],
    ["javascript:alert(1)"],
    ["app"],
    [""],
    ["/app\n"],
    [null],
    [undefined],
  ])("rejects %j", (value) => {
    expect(safeNext(value)).toBe("/app");
  });
});

describe("auth schemas", () => {
  it("normalises email and requires a name", () => {
    const result = signUpSchema.safeParse({
      fullName: "  Ada Lovelace ",
      email: " Ada@Example.COM ",
      password: "correct-horse",
    });
    expect(result.success && result.data).toEqual({
      fullName: "Ada Lovelace",
      email: "ada@example.com",
      password: "correct-horse",
    });
    expect(signUpSchema.safeParse({ fullName: " ", email: "a@b.co", password: "12345678" }).success).toBe(false);
  });

  it("enforces password length on sign-up", () => {
    const base = { fullName: "Ada", email: "ada@example.com" };
    expect(signUpSchema.safeParse({ ...base, password: "short" }).success).toBe(false);
    expect(signUpSchema.safeParse({ ...base, password: "x".repeat(73) }).success).toBe(false);
  });

  it("rejects invalid emails on sign-in", () => {
    expect(signInSchema.safeParse({ email: "not-an-email", password: "x" }).success).toBe(false);
  });

  it("requires matching passwords on reset", () => {
    const mismatch = resetPasswordSchema.safeParse({ password: "password-1", confirmPassword: "password-2" });
    expect(mismatch.success).toBe(false);
    expect(mismatch.error?.issues[0].path).toEqual(["confirmPassword"]);
    expect(
      resetPasswordSchema.safeParse({ password: "password-1", confirmPassword: "password-1" }).success,
    ).toBe(true);
  });
});

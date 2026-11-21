import { describe, expect, it } from "vitest";
import { taskFiltersSchema, taskSchema } from "@/features/tasks/schemas";
import { centsToInput, checkbox, optionalAmountCents } from "@/lib/form-schemas";

describe("taskSchema", () => {
  it("parses a task with rate and checkboxes", () => {
    expect(
      taskSchema.parse({ name: " Design ", defaultHourlyRateCents: "1,250.5", isBillable: "on" }),
    ).toEqual({ name: "Design", defaultHourlyRateCents: 125050, isBillable: true, isCommon: false });
  });

  it("treats a blank rate as no rate", () => {
    expect(taskSchema.parse({ name: "Meetings", defaultHourlyRateCents: "" }).defaultHourlyRateCents).toBeNull();
  });

  it("rejects a missing name and an invalid rate", () => {
    const result = taskSchema.safeParse({ name: "", defaultHourlyRateCents: "abc" });
    expect(result.success).toBe(false);
    expect(result.error!.issues.map((i) => i.path[0])).toEqual(
      expect.arrayContaining(["name", "defaultHourlyRateCents"]),
    );
  });
});

describe("form helpers", () => {
  it("optionalAmountCents rejects negatives, too-precise and huge amounts", () => {
    expect(optionalAmountCents.safeParse("-5").success).toBe(false);
    expect(optionalAmountCents.safeParse("1.234").success).toBe(false);
    expect(optionalAmountCents.safeParse("999999999999").success).toBe(false);
    expect(optionalAmountCents.parse("0")).toBe(0);
  });

  it("checkbox maps presence to a boolean", () => {
    expect(checkbox.parse("on")).toBe(true);
    expect(checkbox.parse(undefined)).toBe(false);
    expect(checkbox.safeParse("yes").success).toBe(false);
  });

  it("centsToInput formats whole and fractional amounts", () => {
    expect(centsToInput(12000)).toBe("120");
    expect(centsToInput(12050)).toBe("120.50");
    expect(centsToInput(null)).toBe("");
  });

  it("task filters default to active", () => {
    expect(taskFiltersSchema.parse({ status: "nope" })).toEqual({ status: "active" });
  });
});

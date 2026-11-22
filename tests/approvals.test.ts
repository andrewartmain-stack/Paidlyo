import { describe, expect, it } from "vitest";
import { isWeekLocked, reviewActions, summarizeWeek } from "@/features/approvals/rules";
import { approvalsTabSchema, reviewSchema, weekStartSchema } from "@/features/approvals/schemas";

describe("isWeekLocked", () => {
  it("locks submitted and approved weeks only while approvals are on", () => {
    expect(isWeekLocked("submitted", true)).toBe(true);
    expect(isWeekLocked("approved", true)).toBe(true);
    expect(isWeekLocked("rejected", true)).toBe(false);
    expect(isWeekLocked(null, true)).toBe(false);
    expect(isWeekLocked("approved", false)).toBe(false);
  });
});

describe("reviewActions", () => {
  it("approves or rejects submitted weeks and reopens approved ones", () => {
    expect(reviewActions("submitted")).toEqual(["approve", "reject"]);
    expect(reviewActions("approved")).toEqual(["reopen"]);
    expect(reviewActions("rejected")).toEqual([]);
  });
});

describe("summarizeWeek", () => {
  it("totals all and billable minutes and groups by project and task, biggest first", () => {
    const entry = (minutes: number, isBillable: boolean, taskName: string) => ({
      minutes,
      isBillable,
      projectName: "Website",
      clientName: "Acme",
      taskName,
    });
    const summary = summarizeWeek([entry(60, true, "Design"), entry(120, false, "Meetings"), entry(30, true, "Design")]);
    expect(summary.minutes).toBe(210);
    expect(summary.billableMinutes).toBe(90);
    expect(summary.lines).toEqual([
      { label: "Website (Acme) · Meetings", minutes: 120 },
      { label: "Website (Acme) · Design", minutes: 90 },
    ]);
  });
});

describe("approval schemas", () => {
  it("accepts only Mondays as a week", () => {
    expect(weekStartSchema.safeParse("2026-11-16").success).toBe(true);
    expect(weekStartSchema.safeParse("2026-11-18").success).toBe(false);
    expect(weekStartSchema.safeParse("nope").success).toBe(false);
  });

  it("validates review input and defaults the tab to pending", () => {
    const id = "6f1c1d1e-2b3a-4c5d-8e9f-0a1b2c3d4e5f";
    expect(reviewSchema.safeParse({ id, action: "approve", note: "" }).success).toBe(true);
    expect(reviewSchema.safeParse({ id, action: "delete", note: "" }).success).toBe(false);
    expect(reviewSchema.safeParse({ id, action: "reject", note: "x".repeat(1001) }).success).toBe(false);
    expect(approvalsTabSchema.parse({})).toEqual({ status: "submitted" });
    expect(approvalsTabSchema.parse({ status: "bogus" })).toEqual({ status: "submitted" });
  });
});

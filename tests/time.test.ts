import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  addDays,
  formatDayTitle,
  isIsoDate,
  todayIn,
  weekDays,
  weekStart,
} from "@/features/time/dates";
import { formatDuration, liveMinutes, parseDuration } from "@/features/time/duration";
import { timeEntrySchema, timesheetParamsSchema } from "@/features/time/schemas";

describe("parseDuration", () => {
  it.each([
    ["1:30", 90],
    ["0:05", 5],
    ["1.5", 90],
    ["1,25", 75],
    ["2", 120],
    [" 8:00 ", 480],
    ["0.1", 6],
  ])("%s → %i minutes", (input, minutes) => {
    expect(parseDuration(input)).toBe(minutes);
  });

  it.each(["", "abc", "1:60", "1:5", "1.234", "-1", "100"])("rejects %j", (input) => {
    expect(parseDuration(input)).toBeNull();
  });
});

describe("formatDuration / liveMinutes", () => {
  it("formats minutes as h:mm", () => {
    expect(formatDuration(0)).toBe("0:00");
    expect(formatDuration(90)).toBe("1:30");
    expect(formatDuration(605)).toBe("10:05");
  });

  it("adds elapsed timer minutes, capped at 24h", () => {
    const start = "2026-11-20T10:00:00Z";
    const at = (iso: string) => Date.parse(iso);
    expect(liveMinutes(30, null, at("2026-11-20T12:00:00Z"))).toBe(30);
    expect(liveMinutes(30, start, at("2026-11-20T10:44:40Z"))).toBe(75);
    expect(liveMinutes(30, start, at("2026-11-22T10:00:00Z"))).toBe(1440);
  });
});

describe("dates", () => {
  it("validates ISO dates", () => {
    expect(isIsoDate("2026-11-20")).toBe(true);
    expect(isIsoDate("2026-02-30")).toBe(false);
    expect(isIsoDate("20-11-2026")).toBe(false);
  });

  it("resolves today in the organization's timezone", () => {
    const now = new Date("2026-11-20T23:30:00Z");
    expect(todayIn("UTC", now)).toBe("2026-11-20");
    expect(todayIn("Europe/Bucharest", now)).toBe("2026-11-21");
    expect(todayIn("America/Los_Angeles", now)).toBe("2026-11-20");
  });

  it("does day and Monday-start week math across months and DST", () => {
    expect(addDays("2026-11-30", 1)).toBe("2026-12-01");
    expect(addDays("2026-03-29", -1)).toBe("2026-03-28");
    expect(weekStart("2026-11-20")).toBe("2026-11-16"); // Friday → Monday
    expect(weekStart("2026-11-22")).toBe("2026-11-16"); // Sunday → previous Monday
    expect(weekStart("2026-11-16")).toBe("2026-11-16");
    expect(weekDays("2026-11-20")).toEqual([
      "2026-11-16", "2026-11-17", "2026-11-18", "2026-11-19", "2026-11-20", "2026-11-21", "2026-11-22",
    ]);
  });

  it("formats the day title", () => {
    expect(formatDayTitle("2026-11-20", "2026-11-20")).toBe("Friday 20 November");
    expect(formatDayTitle("2025-12-31", "2026-11-20")).toBe("Wednesday, 31 December 2025");
  });
});

describe("timeEntrySchema", () => {
  const base = {
    projectId: "6f1c2b4e-8d3a-4c7e-9b2f-1a2b3c4d5e6f",
    taskId: "0b9f6a52-3c1d-4e8f-9a7b-2c3d4e5f6a7b",
    spentDate: "2026-11-20",
    notes: "  Homepage wireframes ",
    duration: "1:30",
  };

  it("parses an entry", () => {
    expect(timeEntrySchema.parse(base)).toEqual({ ...base, notes: "Homepage wireframes", duration: 90 });
  });

  it("blank duration = null (timer), missing duration = undefined (keep minutes)", () => {
    expect(timeEntrySchema.parse({ ...base, duration: "" }).duration).toBeNull();
    const { duration: _omit, ...withoutDuration } = base;
    void _omit;
    expect(timeEntrySchema.parse(withoutDuration).duration).toBeUndefined();
  });

  it("rejects bad durations, dates and ids", () => {
    const result = timeEntrySchema.safeParse({
      ...base,
      projectId: "x",
      spentDate: "2026-13-01",
      duration: "25:00",
    });
    expect(result.success).toBe(false);
    expect(Object.keys(z.flattenError(result.error!).fieldErrors)).toEqual(
      expect.arrayContaining(["projectId", "spentDate", "duration"]),
    );
  });

  it("timesheet params ignore invalid values", () => {
    expect(timesheetParamsSchema.parse({ date: "nope", track: "yes" })).toEqual({
      date: undefined,
      view: "day",
      track: undefined,
    });
    expect(timesheetParamsSchema.parse({ date: "2026-11-18", track: "1" })).toEqual({
      date: "2026-11-18",
      view: "day",
      track: "1",
    });
  });
});

describe("live clock", () => {
  it("counts seconds on a running timer", async () => {
    const { formatClock, liveSeconds } = await import("@/features/time/duration");
    const start = "2026-11-20T10:00:00Z";
    expect(formatClock(liveSeconds(0, start, Date.parse("2026-11-20T10:00:07Z")))).toBe("0:00:07");
    expect(formatClock(liveSeconds(90, start, Date.parse("2026-11-20T10:02:05Z")))).toBe("1:32:05");
    expect(formatClock(liveSeconds(30, null, Date.now()))).toBe("0:30:00");
  });
});

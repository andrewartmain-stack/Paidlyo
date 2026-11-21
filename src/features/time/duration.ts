/** Longest single entry: 24 hours. */
export const MAX_ENTRY_MINUTES = 24 * 60;

/**
 * Parses a duration typed by a person: "1:30", "0:05", "1.5", "1,5" or "2" (hours).
 * Returns minutes, or null when the text isn't a duration.
 */
export function parseDuration(input: string): number | null {
  const value = input.trim();
  const clock = /^(\d{1,2}):([0-5]\d)$/.exec(value);
  if (clock) return Number(clock[1]) * 60 + Number(clock[2]);

  const decimal = /^(\d{1,2})(?:[.,](\d{1,2}))?$/.exec(value);
  if (decimal) {
    const hundredths = Number(decimal[1]) * 100 + Number((decimal[2] ?? "").padEnd(2, "0"));
    return Math.round((hundredths * 60) / 100);
  }
  return null;
}

/** 90 → "1:30" */
export function formatDuration(minutes: number): string {
  const safe = Math.max(0, Math.floor(minutes));
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, "0")}`;
}

/** Minutes on an entry including a running timer, measured at `nowMs`. */
export function liveMinutes(minutes: number, timerStartedAt: string | null, nowMs: number): number {
  if (!timerStartedAt) return minutes;
  const elapsed = Math.max(0, Math.round((nowMs - Date.parse(timerStartedAt)) / 60_000));
  return Math.min(MAX_ENTRY_MINUTES, minutes + elapsed);
}

/** Seconds on an entry including a running timer, measured at `nowMs` (capped at 24h). */
export function liveSeconds(minutes: number, timerStartedAt: string | null, nowMs: number): number {
  const stored = minutes * 60;
  if (!timerStartedAt) return stored;
  const elapsed = Math.max(0, Math.floor((nowMs - Date.parse(timerStartedAt)) / 1000));
  return Math.min(MAX_ENTRY_MINUTES * 60, stored + elapsed);
}

/** 3725 → "1:02:05" */
export function formatClock(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = safe % 60;
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

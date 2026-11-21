/*
 * Calendar dates as ISO strings ("2026-11-20"). Math is done in UTC so the server's timezone
 * never shifts a day; "today" is resolved in the organization's timezone.
 */

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function isIsoDate(value: string): boolean {
  if (!ISO_DATE.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

/** Today's date in the given IANA timezone. */
export function todayIn(timeZone: string, now: Date = new Date()): string {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

function toUtc(iso: string): Date {
  return new Date(`${iso}T00:00:00Z`);
}

export function addDays(iso: string, days: number): string {
  const date = toUtc(iso);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** Monday of the week containing `iso`. */
export function weekStart(iso: string): string {
  const day = toUtc(iso).getUTCDay(); // 0 = Sunday
  return addDays(iso, -((day + 6) % 7));
}

/** The 7 dates (Mon–Sun) of the week containing `iso`. */
export function weekDays(iso: string): string[] {
  const start = weekStart(iso);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

function format(iso: string, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat("en-GB", { ...options, timeZone: "UTC" }).format(toUtc(iso));
}

/** "Friday, 20 November" (year added when not the current year). */
export function formatDayTitle(iso: string, today: string): string {
  const sameYear = iso.slice(0, 4) === today.slice(0, 4);
  return format(iso, { weekday: "long", day: "numeric", month: "long", year: sameYear ? undefined : "numeric" });
}

/** "Mon" */
export function formatWeekday(iso: string): string {
  return format(iso, { weekday: "short" });
}

/** "20 Nov" */
export function formatShortDate(iso: string): string {
  return format(iso, { day: "numeric", month: "short" });
}

/** "16 – 22 November", "28 November – 4 December", with the year when not the current one. */
export function formatWeekRange(days: string[], today: string): string {
  const first = days[0];
  const last = days[days.length - 1];
  const year = last.slice(0, 4) === today.slice(0, 4) ? "" : ` ${last.slice(0, 4)}`;
  const sameMonth = first.slice(0, 7) === last.slice(0, 7);
  const start = sameMonth ? format(first, { day: "numeric" }) : format(first, { day: "numeric", month: "long" });
  return `${start} – ${format(last, { day: "numeric", month: "long" })}${year}`;
}

/** "20 Nov 2026" */
export function formatDate(iso: string): string {
  return format(iso, { day: "numeric", month: "short", year: "numeric" });
}

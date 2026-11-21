import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatWeekday } from "../dates";
import { formatDuration } from "../duration";

export function timesheetHref(date: string, today: string, view: "day" | "week" = "day") {
  const params = new URLSearchParams();
  if (view === "week") params.set("view", "week");
  if (date !== today) params.set("date", date);
  const query = params.toString();
  return query ? `/app/time?${query}` : "/app/time";
}

/** Mon–Sun with each day's total; the selected day is highlighted. */
export function WeekStrip({
  days,
  selected,
  today,
  totals,
}: {
  days: string[];
  selected: string;
  today: string;
  totals: Map<string, number>;
}) {
  const weekTotal = days.reduce((sum, day) => sum + (totals.get(day) ?? 0), 0);

  return (
    <nav aria-label="Days of the week" className="grid grid-cols-4 gap-1 sm:grid-cols-8">
      {days.map((day) => {
        const active = day === selected;
        return (
          <Link
            key={day}
            href={timesheetHref(day, today)}
            aria-current={active ? "date" : undefined}
            className={cn(
              "flex flex-col rounded-lg px-3 py-2 text-sm outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring",
              active && "bg-card ring-1 ring-border hover:bg-card",
            )}
          >
            <span className={cn("text-muted-foreground", day === today && "font-semibold text-brand")}>
              {formatWeekday(day)}
            </span>
            <span className="font-medium tabular-nums">{formatDuration(totals.get(day) ?? 0)}</span>
          </Link>
        );
      })}
      <div className="flex flex-col px-3 py-2 text-sm sm:border-l">
        <span className="text-muted-foreground">Week total</span>
        <span className="font-semibold tabular-nums">{formatDuration(weekTotal)}</span>
      </div>
    </nav>
  );
}

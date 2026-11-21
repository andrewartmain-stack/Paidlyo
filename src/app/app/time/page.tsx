import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { StopwatchIllustration } from "@/components/illustrations";
import { PageIcon } from "@/components/page-icon";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getCurrentOrg } from "@/features/organizations/queries";
import { TimeEntryList } from "@/features/time/components/time-entry-list";
import { TrackTimeDialogButton } from "@/features/time/components/track-time-dialog-button";
import { WeekGrid } from "@/features/time/components/week-grid";
import {
  timesheetHref,
  WeekStrip,
} from "@/features/time/components/week-strip";
import { StatusTabs } from "@/components/status-tabs";
import {
  addDays,
  formatDayTitle,
  formatWeekRange,
  todayIn,
  weekDays,
} from "@/features/time/dates";
import { formatDuration } from "@/features/time/duration";
import { getWeekSheet, listTrackableProjects } from "@/features/time/queries";
import { buildWeekRows } from "@/features/time/week";
import { timesheetParamsSchema } from "@/features/time/schemas";

export const metadata: Metadata = { title: "Timesheet" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default function TimesheetPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <div className="flex flex-col gap-6">
      <Suspense fallback={<TimesheetSkeleton />}>
        <Timesheet searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Timesheet({ searchParams }: { searchParams: SearchParams }) {
  const params = timesheetParamsSchema.parse(await searchParams);
  const org = await getCurrentOrg();
  const today = todayIn(org.timezone);
  const date = params.date ?? today;
  const days = weekDays(date);

  const [{ entries: weekEntries, totals, nowMs: serverNowMs }, projects] =
    await Promise.all([getWeekSheet(days), listTrackableProjects()]);
  const entries = weekEntries.filter((e) => e.spentDate === date);
  const isToday = date === today;
  const isWeek = params.view === "week";
  const title = formatDayTitle(date, today);
  const thisWeek = days.includes(today);
  const step = isWeek ? 7 : 1;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <PageIcon icon={Clock} />
          <div className="flex gap-1">
            <Link
              href={timesheetHref(addDays(date, -step), today, params.view)}
              aria-label={isWeek ? "Previous week" : "Previous day"}
              className={buttonVariants({ variant: "outline", size: "icon" })}
            >
              <ChevronLeft aria-hidden />
            </Link>
            <Link
              href={timesheetHref(addDays(date, step), today, params.view)}
              aria-label={isWeek ? "Next week" : "Next day"}
              className={buttonVariants({ variant: "outline", size: "icon" })}
            >
              <ChevronRight aria-hidden />
            </Link>
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl">
              {isWeek ? (
                <>
                  {thisWeek && (
                    <span className="text-brand">This week: </span>
                  )}
                  {formatWeekRange(days, today)}
                </>
              ) : (
                <>
                  {isToday && <span className="text-brand">Today: </span>}
                  {title}
                </>
              )}
            </h1>
            {(isWeek ? !thisWeek : !isToday) && (
              <Link
                href={timesheetHref(today, today, params.view)}
                className="text-sm text-brand underline-offset-4 hover:underline"
              >
                {isWeek ? "Return to this week" : "Return to today"}
              </Link>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <StatusTabs
            label="Timesheet view"
            tabs={[
              {
                href: timesheetHref(date, today, "day"),
                label: "Day",
                active: !isWeek,
              },
              {
                href: timesheetHref(date, today, "week"),
                label: "Week",
                active: isWeek,
              },
            ]}
          />
          {/* Remount when ?track=1 appears so the sidebar button opens the dialog here too. */}
          <TrackTimeDialogButton
            key={params.track ?? "closed"}
            projects={projects}
            date={date}
            dateLabel={title}
            isToday={isToday}
          />
        </div>
      </div>

      {isWeek ? (
        <WeekGrid
          rows={buildWeekRows(weekEntries, days, serverNowMs)}
          days={days}
          today={today}
          projects={projects}
        />
      ) : (
        <>
          <WeekStrip
            days={days}
            selected={date}
            today={today}
            totals={totals}
          />

          <Card className="gap-0 py-0">
            {entries.length > 0 ? (
              <TimeEntryList
                entries={entries}
                projects={projects}
                date={date}
                dateLabel={title}
                isToday={isToday}
                serverNowMs={serverNowMs}
              />
            ) : (
              <div className="flex flex-col items-center gap-1 px-6 py-12 text-center">
                <StopwatchIllustration className="mb-3 h-32 w-auto" />
                <h2 className="text-base">
                  No time tracked {isToday ? "today" : "on this day"}
                </h2>
                <p className="max-w-sm text-sm text-muted-foreground">
                  {projects.length > 0 ? (
                    "Use Track time to add an entry or start a timer."
                  ) : (
                    <>
                      You need a project with at least one task first.{" "}
                      <Link
                        href="/app/projects"
                        className="text-brand underline-offset-4 hover:underline"
                      >
                        Go to projects
                      </Link>
                    </>
                  )}
                </p>
              </div>
            )}
            <div className="flex items-center justify-between border-t px-4 py-3 text-sm sm:px-5">
              <span className="text-muted-foreground">Total</span>
              <span className="font-heading text-lg font-semibold tabular-nums">
                {formatDuration(totals.get(date) ?? 0)}
              </span>
            </div>
          </Card>
        </>
      )}
    </>
  );
}

function TimesheetSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading timesheet"
      className="flex flex-col gap-6"
    >
      <div className="h-12 w-80 rounded-lg bg-muted" />
      <div className="h-14 w-full rounded-lg bg-muted" />
      <div className="h-72 rounded-xl bg-muted" />
    </div>
  );
}

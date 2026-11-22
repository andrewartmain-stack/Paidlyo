"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { PostgrestError } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import { getCurrentUser } from "@/features/auth/queries";
import { writeBlocked } from "@/features/billing/guard";
import { getCurrentOrg } from "@/features/organizations/queries";
import { todayIn } from "./dates";
import { listDaySources, listTrackableProjects } from "./queries";
import { copyDaySchema, timeEntryIdSchema, timeEntrySchema, weekCellSchema, type WeekCellInput } from "./schemas";
import { copyableItems, copySummary, decideCellChange } from "./week";

const NOT_FOUND = "This time entry no longer exists.";
const GENERIC_ERROR = "Something went wrong. Please try again.";
const TIMESHEET_PATH = "/app/time";

function invalid(error: z.ZodError) {
  return fail("Please fix the highlighted fields.", z.flattenError(error).fieldErrors);
}

/** Maps database errors raised by the time_entries trigger / constraints to form errors. */
const INVOICED = "This time is on a sent invoice, so it can't be changed.";
const WEEK_LOCKED = "This week is submitted for approval or approved, so its time can't be changed.";

function lockError(hint: string | undefined) {
  if (hint === "entry_invoiced") return fail(INVOICED);
  if (hint === "week_locked") return fail(WEEK_LOCKED);
  return fail(GENERIC_ERROR);
}

function entryError(error: PostgrestError) {
  if (error.hint === "entry_invoiced") return fail(INVOICED);
  if (error.hint === "week_locked") return fail(WEEK_LOCKED);
  if (error.hint === "project_archived") {
    return fail("Please fix the highlighted fields.", { projectId: ["This project is archived."] });
  }
  if (error.hint === "task_not_on_project" || error.code === "23503") {
    return fail("Please fix the highlighted fields.", { taskId: ["This task isn't enabled on the project."] });
  }
  return fail(GENERIC_ERROR);
}

export async function createTimeEntry(formData: FormData): Promise<ActionResult> {
  const parsed = timeEntrySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(parsed.error);

  const [org, user] = await Promise.all([getCurrentOrg(), getCurrentUser()]);
  const blocked = await writeBlocked(org.id);
  if (blocked) return fail(blocked);
  const v = parsed.data;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("time_entries")
    .insert({
      organization_id: org.id,
      user_id: user.id,
      project_id: v.projectId,
      task_id: v.taskId,
      spent_date: v.spentDate,
      minutes: v.duration ?? 0,
      notes: v.notes,
    })
    .select("id")
    .single();
  if (error) return entryError(error);

  // No duration on today's sheet = start a timer (like Harvest).
  if (v.duration == null && v.spentDate === todayIn(org.timezone)) {
    const { error: timerError } = await supabase.rpc("start_timer", { p_entry_id: data.id });
    if (timerError) return fail("The entry was saved, but the timer couldn't start.");
  }

  revalidatePath(TIMESHEET_PATH);
  return ok();
}

export async function updateTimeEntry(id: string, formData: FormData): Promise<ActionResult> {
  const entryId = timeEntryIdSchema.safeParse(id);
  if (!entryId.success) return fail(NOT_FOUND);
  const parsed = timeEntrySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(parsed.error);

  const [org, user] = await Promise.all([getCurrentOrg(), getCurrentUser()]);
  const blocked = await writeBlocked(org.id);
  if (blocked) return fail(blocked);
  const v = parsed.data;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("time_entries")
    .update({
      project_id: v.projectId,
      task_id: v.taskId,
      spent_date: v.spentDate,
      notes: v.notes,
      // undefined = duration field disabled (timer running): keep the stored minutes.
      ...(v.duration !== undefined && { minutes: v.duration ?? 0 }),
    })
    .eq("id", entryId.data)
    .eq("organization_id", org.id)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();
  if (error) return entryError(error);
  if (!data) return fail(NOT_FOUND);

  revalidatePath(TIMESHEET_PATH);
  return ok();
}

export async function deleteTimeEntry(id: string): Promise<ActionResult> {
  const entryId = timeEntryIdSchema.safeParse(id);
  if (!entryId.success) return fail(NOT_FOUND);

  const [org, user] = await Promise.all([getCurrentOrg(), getCurrentUser()]);
  const blocked = await writeBlocked(org.id);
  if (blocked) return fail(blocked);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("time_entries")
    .delete()
    .eq("id", entryId.data)
    .eq("organization_id", org.id)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();
  if (error) return lockError(error.hint);
  if (!data) return fail(NOT_FOUND);

  revalidatePath(TIMESHEET_PATH);
  return ok();
}

export async function startTimer(id: string): Promise<ActionResult> {
  const entryId = timeEntryIdSchema.safeParse(id);
  if (!entryId.success) return fail(NOT_FOUND);

  const org = await getCurrentOrg();
  const blocked = await writeBlocked(org.id);
  if (blocked) return fail(blocked);
  const supabase = await createClient();
  const { error } = await supabase.rpc("start_timer", { p_entry_id: entryId.data });
  if (error) {
    if (error.hint === "not_found") return fail(NOT_FOUND);
    if (error.hint === "entry_full") return fail("This entry already has 24 hours.");
    return lockError(error.hint);
  }

  revalidatePath(TIMESHEET_PATH);
  return ok();
}

export async function stopTimer(id: string): Promise<ActionResult> {
  const entryId = timeEntryIdSchema.safeParse(id);
  if (!entryId.success) return fail(NOT_FOUND);

  const supabase = await createClient();
  const { error } = await supabase.rpc("stop_timer", { p_entry_id: entryId.data });
  if (error) return lockError(error.hint);

  revalidatePath(TIMESHEET_PATH);
  return ok();
}

/**
 * Week grid: sets the total for one project + task + day. Creates, updates or deletes that
 * day's single entry; refuses when there are several entries or a running timer.
 */
export async function setWeekCell(input: WeekCellInput): Promise<ActionResult> {
  const parsed = weekCellSchema.safeParse(input);
  if (!parsed.success) {
    const message = z.flattenError(parsed.error).fieldErrors.duration?.[0];
    return fail(message ?? "Enter a duration like 1:30 or 1.5.");
  }

  const [org, user] = await Promise.all([getCurrentOrg(), getCurrentUser()]);
  const blocked = await writeBlocked(org.id);
  if (blocked) return fail(blocked);
  const { projectId, taskId, date, duration } = parsed.data;
  const supabase = await createClient();

  const { data: existing, error: loadError } = await supabase
    .from("time_entries")
    .select("id, minutes, notes, timer_started_at, invoice_item_id")
    .eq("organization_id", org.id)
    .eq("user_id", user.id)
    .eq("project_id", projectId)
    .eq("task_id", taskId)
    .eq("spent_date", date);
  if (loadError) return fail(GENERIC_ERROR);

  const change = decideCellChange(
    existing.map((e) => ({
      id: e.id,
      minutes: e.minutes,
      notes: e.notes,
      running: e.timer_started_at !== null,
      invoiced: e.invoice_item_id !== null,
    })),
    duration,
  );

  let error: PostgrestError | null = null;
  switch (change.kind) {
    case "none":
      return ok();
    case "refuse":
      return fail(change.reason);
    case "create":
      ({ error } = await supabase.from("time_entries").insert({
        organization_id: org.id,
        user_id: user.id,
        project_id: projectId,
        task_id: taskId,
        spent_date: date,
        minutes: change.minutes,
      }));
      break;
    case "update":
      ({ error } = await supabase
        .from("time_entries")
        .update({ minutes: change.minutes })
        .eq("id", change.id)
        .eq("user_id", user.id)
        .is("timer_started_at", null));
      break;
    case "delete":
      ({ error } = await supabase
        .from("time_entries")
        .delete()
        .eq("id", change.id)
        .eq("user_id", user.id)
        .is("timer_started_at", null));
      break;
  }
  if (error) {
    const result = entryError(error);
    return result.fieldErrors ? fail(Object.values(result.fieldErrors)[0]?.[0] ?? GENERIC_ERROR) : result;
  }

  revalidatePath(TIMESHEET_PATH);
  return ok();
}

/**
 * Day view "Copy from …": creates the same entries (project, task, notes) at 0:00 on an empty
 * day. Hours are never copied. Archived projects and disabled tasks are skipped.
 */
export async function copyDayEntries(fromDate: string, toDate: string): Promise<ActionResult<{ message: string }>> {
  const parsed = copyDaySchema.safeParse({ fromDate, toDate });
  if (!parsed.success) return fail("Choose an earlier day to copy from.");

  const [org, user] = await Promise.all([getCurrentOrg(), getCurrentUser()]);
  const blocked = await writeBlocked(org.id);
  if (blocked) return fail(blocked);

  const [target, sources, projects] = await Promise.all([
    listDaySources(parsed.data.toDate),
    listDaySources(parsed.data.fromDate),
    listTrackableProjects(),
  ]);
  if (target.length > 0) return fail("This day already has time. Copying only works on an empty day.");

  const { items, skipped } = copyableItems(sources, projects, { dedupe: false });
  if (items.length === 0) {
    return fail(sources.length === 0 ? "There's nothing to copy from that day." : "Those projects or tasks are archived now.");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("time_entries").insert(
    items.map((item) => ({
      organization_id: org.id,
      user_id: user.id,
      project_id: item.project.id,
      task_id: item.task.id,
      spent_date: parsed.data.toDate,
      minutes: 0,
      notes: item.notes,
    })),
  );
  if (error) return entryError(error);

  revalidatePath(TIMESHEET_PATH);
  return ok({ message: copySummary(items.length, skipped, "entry") });
}

import { liveMinutes } from "./duration";
import type { TimeEntry } from "./types";

export type WeekCell = {
  minutes: number;
  /** One entry (or none) and no running timer: the cell can be typed into. */
  editable: boolean;
  entryCount: number;
  running: boolean;
  invoiced: boolean;
};

export type WeekRow = {
  key: string;
  project: TimeEntry["project"];
  task: TimeEntry["task"];
  cells: Record<string, WeekCell>;
  total: number;
};

export function rowKey(projectId: string, taskId: string) {
  return `${projectId}:${taskId}`;
}

export function emptyCell(): WeekCell {
  return { minutes: 0, editable: true, entryCount: 0, running: false, invoiced: false };
}

/** Groups a week's entries into project + task rows, sorted by client, project, task. */
export function buildWeekRows(entries: TimeEntry[], days: string[], nowMs: number): WeekRow[] {
  const rows = new Map<string, WeekRow>();

  for (const entry of entries) {
    const key = rowKey(entry.project.id, entry.task.id);
    let row = rows.get(key);
    if (!row) {
      row = {
        key,
        project: entry.project,
        task: entry.task,
        cells: Object.fromEntries(days.map((d) => [d, emptyCell()])),
        total: 0,
      };
      rows.set(key, row);
    }
    const cell = row.cells[entry.spentDate];
    if (!cell) continue; // outside the week
    const minutes = liveMinutes(entry.minutes, entry.timerStartedAt, nowMs);
    cell.minutes += minutes;
    cell.entryCount += 1;
    cell.running ||= entry.timerStartedAt !== null;
    cell.invoiced ||= entry.invoiced;
    cell.editable = cell.entryCount <= 1 && !cell.running && !cell.invoiced;
    row.total += minutes;
  }

  return [...rows.values()].sort(
    (a, b) =>
      a.project.clientName.localeCompare(b.project.clientName) ||
      a.project.name.localeCompare(b.project.name) ||
      a.task.name.localeCompare(b.task.name),
  );
}

export type CellEntry = {
  id: string;
  minutes: number;
  notes: string | null;
  running: boolean;
  invoiced: boolean;
};

export type CellChange =
  | { kind: "none" }
  | { kind: "create"; minutes: number }
  | { kind: "update"; id: string; minutes: number }
  | { kind: "delete"; id: string }
  | { kind: "refuse"; reason: string };

/**
 * What typing `minutes` into a week-grid cell does to that cell's entries.
 * Blank (null) and 0 clear the cell: the entry is deleted unless it has notes (kept at 0:00).
 */
export function decideCellChange(existing: CellEntry[], minutes: number | null): CellChange {
  if (existing.some((e) => e.invoiced)) {
    return { kind: "refuse", reason: "This time is on an invoice, so it can't be changed here." };
  }
  if (existing.some((e) => e.running)) {
    return { kind: "refuse", reason: "A timer is running on this day. Stop it first." };
  }
  if (existing.length > 1) {
    return { kind: "refuse", reason: "This day has several entries. Edit them in the day view." };
  }

  const clearing = minutes === null || minutes === 0;
  const [entry] = existing;
  if (!entry) return clearing ? { kind: "none" } : { kind: "create", minutes: minutes! };
  if (clearing) {
    if (entry.notes) return entry.minutes === 0 ? { kind: "none" } : { kind: "update", id: entry.id, minutes: 0 };
    return { kind: "delete", id: entry.id };
  }
  return entry.minutes === minutes ? { kind: "none" } : { kind: "update", id: entry.id, minutes };
}

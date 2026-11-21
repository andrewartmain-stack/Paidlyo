import { createHash } from "node:crypto";
import type { HarvestRow, RowError } from "./harvest";

/* Turns parsed Harvest rows into what import_harvest needs, plus a preview for the user. */

/** The organization's current data, to reuse records by name and skip imported rows. */
export type ExistingData = {
  clients: { id: string; name: string }[];
  projects: { id: string; clientId: string; name: string; archived: boolean }[];
  tasks: { id: string; name: string }[];
  projectTasks: { projectId: string; taskId: string }[];
  importKeys: Set<string>;
};

export type ImportOptions = { includeInvoiced: boolean; orgCurrency: string };

type EntryPayload = {
  project_id: string;
  task_id: string;
  spent_date: string;
  minutes: number;
  notes: string | null;
  import_key: string;
};

/** Argument of the import_harvest RPC (see the harvest_import migration). */
export type ImportPayload = {
  clients: { id: string; name: string; currency: string }[];
  tasks: { id: string; name: string }[];
  projects: {
    id: string;
    client_id: string;
    name: string;
    code: string | null;
    billing_method: "project_rate" | "none";
    hourly_rate_cents: number | null;
  }[];
  project_tasks: { project_id: string; task_id: string; is_billable: boolean }[];
  entries: EntryPayload[];
  non_billable_entries: EntryPayload[];
};

export type ImportPreview = {
  /** Rows that will be inserted. */
  newEntries: number;
  newMinutes: number;
  duplicates: number;
  invoicedSkipped: number;
  /** Billable rows on new projects whose Harvest rate differs from the project's rate. */
  rateMismatches: number;
  newClients: string[];
  reusedClients: number;
  newProjects: { name: string; client: string }[];
  reusedProjects: number;
  newTasks: string[];
  reusedTasks: number;
  people: { name: string; rows: number }[];
  errors: RowError[];
};

export type ImportPlan = { payload: ImportPayload; preview: ImportPreview };

/** Names match ignoring case and repeated spaces. */
export function nameKey(name: string): string {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

function fingerprint(row: HarvestRow): string {
  return [row.date, nameKey(row.client), nameKey(row.project), nameKey(row.task), row.notes ?? "", row.minutes].join(
    "\u001f",
  );
}

/**
 * Stable id of a Harvest row: its fields plus how many identical rows came before it in the
 * file (two equal 1h entries on the same day are both kept). Same file → same keys.
 */
export function importKeys(rows: HarvestRow[]): string[] {
  const seen = new Map<string, number>();
  return rows.map((row) => {
    const base = fingerprint(row);
    const n = (seen.get(base) ?? 0) + 1;
    seen.set(base, n);
    return `harvest:${createHash("sha256").update(`${base}\u001f${n}`).digest("hex").slice(0, 40)}`;
  });
}

/** Map of key → value where the first item with a key wins (duplicate names reuse the oldest). */
function firstByKey<T, V>(items: T[], key: (item: T) => string, value: (item: T) => V): Map<string, V> {
  const map = new Map<string, V>();
  for (const item of items) if (!map.has(key(item))) map.set(key(item), value(item));
  return map;
}

/** Most common value; ties go to the first one seen. */
function mostCommon<T>(values: T[]): T | null {
  const counts = new Map<T, number>();
  let best: T | null = null;
  let bestCount = 0;
  for (const value of values) {
    const count = (counts.get(value) ?? 0) + 1;
    counts.set(value, count);
    if (count > bestCount) {
      best = value;
      bestCount = count;
    }
  }
  return best;
}

export function buildImportPlan(
  rows: HarvestRow[],
  parseErrors: RowError[],
  existing: ExistingData,
  options: ImportOptions,
  newId: () => string,
): ImportPlan {
  const errors = [...parseErrors];
  const payload: ImportPayload = {
    clients: [],
    tasks: [],
    projects: [],
    project_tasks: [],
    entries: [],
    non_billable_entries: [],
  };

  const clients = firstByKey(existing.clients, (c) => nameKey(c.name), (c) => ({ id: c.id, isNew: false }));
  const tasks = firstByKey(existing.tasks, (t) => nameKey(t.name), (t) => ({ id: t.id, isNew: false }));
  const projects = firstByKey(
    existing.projects,
    (p) => `${p.clientId}|${nameKey(p.name)}`,
    (p) => ({ id: p.id, isNew: false, archived: p.archived }),
  );
  const links = new Set(existing.projectTasks.map((pt) => `${pt.projectId}|${pt.taskId}`));
  const newLinks = new Map<string, ImportPayload["project_tasks"][number]>();
  const newProjectRows = new Map<string, HarvestRow[]>();
  const used = { clients: new Set<string>(), projects: new Set<string>(), tasks: new Set<string>() };
  const people = new Map<string, number>();
  const newProjectNames: ImportPreview["newProjects"] = [];
  let duplicates = 0;
  let invoicedSkipped = 0;
  let newMinutes = 0;
  const billableOnNewProjects: { projectId: string; rateCents: number | null }[] = [];

  const keys = importKeys(rows);
  rows.forEach((row, i) => {
    people.set(row.person, (people.get(row.person) ?? 0) + 1);
    if (row.invoiced && !options.includeInvoiced) {
      invoicedSkipped++;
      return;
    }
    if (existing.importKeys.has(keys[i])) {
      duplicates++;
      return;
    }

    let client = clients.get(nameKey(row.client));
    if (!client) {
      client = { id: newId(), isNew: true };
      clients.set(nameKey(row.client), client);
      payload.clients.push({ id: client.id, name: row.client, currency: row.currency ?? options.orgCurrency });
    }

    const projectKey = `${client.id}|${nameKey(row.project)}`;
    let project = projects.get(projectKey);
    if (project?.archived) {
      errors.push({
        row: row.row,
        message: `Project "${row.project}" is archived in Paidlyo. Restore it on the Projects page first.`,
      });
      return;
    }
    if (!project) {
      project = { id: newId(), isNew: true, archived: false };
      projects.set(projectKey, project);
      newProjectRows.set(project.id, []);
      newProjectNames.push({ name: row.project, client: row.client });
      payload.projects.push({
        id: project.id,
        client_id: client.id,
        name: row.project,
        code: row.projectCode,
        billing_method: "none",
        hourly_rate_cents: null,
      });
    }

    let task = tasks.get(nameKey(row.task));
    if (!task) {
      task = { id: newId(), isNew: true };
      tasks.set(nameKey(row.task), task);
      payload.tasks.push({ id: task.id, name: row.task });
    }

    const linkKey = `${project.id}|${task.id}`;
    if (!links.has(linkKey)) {
      const link = newLinks.get(linkKey) ?? { project_id: project.id, task_id: task.id, is_billable: false };
      link.is_billable ||= row.billable;
      newLinks.set(linkKey, link);
    }

    used.clients.add(client.id);
    used.projects.add(project.id);
    used.tasks.add(task.id);
    newProjectRows.get(project.id)?.push(row);

    const entry: EntryPayload = {
      project_id: project.id,
      task_id: task.id,
      spent_date: row.date,
      minutes: row.minutes,
      notes: row.notes,
      import_key: keys[i],
    };
    newMinutes += row.minutes;
    if (row.billable && !row.invoiced) {
      payload.entries.push(entry);
      if (project.isNew) billableOnNewProjects.push({ projectId: project.id, rateCents: row.rateCents });
    } else {
      payload.non_billable_entries.push(entry);
    }
  });

  // New projects: project rate = the most common Harvest rate of their billable rows.
  for (const project of payload.projects) {
    const billable = (newProjectRows.get(project.id) ?? []).filter((r) => r.billable);
    if (billable.length === 0) continue;
    project.billing_method = "project_rate";
    project.hourly_rate_cents = mostCommon(billable.map((r) => r.rateCents));
  }
  const rateOf = new Map(payload.projects.map((p) => [p.id, p.hourly_rate_cents]));
  const rateMismatches = billableOnNewProjects.filter((e) => e.rateCents !== rateOf.get(e.projectId)).length;

  payload.project_tasks = [...newLinks.values()];
  const countReused = (set: Set<string>, created: Set<string>) => [...set].filter((id) => !created.has(id)).length;

  return {
    payload,
    preview: {
      newEntries: payload.entries.length + payload.non_billable_entries.length,
      newMinutes,
      duplicates,
      invoicedSkipped,
      rateMismatches,
      newClients: payload.clients.map((c) => c.name),
      reusedClients: countReused(used.clients, new Set(payload.clients.map((c) => c.id))),
      newProjects: newProjectNames,
      reusedProjects: countReused(used.projects, new Set(payload.projects.map((p) => p.id))),
      newTasks: payload.tasks.map((t) => t.name),
      reusedTasks: countReused(used.tasks, new Set(payload.tasks.map((t) => t.id))),
      people: [...people].map(([name, count]) => ({ name, rows: count })).sort((a, b) => b.rows - a.rows),
      errors: errors.sort((a, b) => a.row - b.row),
    },
  };
}

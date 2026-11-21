import { entryAmountCents, type MoneyByCurrency } from "./aggregate";

/** A billable, uninvoiced, stopped time entry (what "Add unbilled time" would pick up). */
export type UnbilledEntry = {
  spentDate: string;
  minutes: number;
  hourlyRateCents: number | null;
  client: { id: string; name: string; currency: string };
  project: { id: string; name: string };
};

type UnbilledTotals = { minutes: number; amountCents: number; oldestDate: string };
export type UnbilledProjectRow = UnbilledTotals & { id: string; name: string };
export type UnbilledClientRow = UnbilledTotals & {
  id: string;
  name: string;
  currency: string;
  projects: UnbilledProjectRow[];
};

function add(row: UnbilledTotals, entry: UnbilledEntry) {
  row.minutes += entry.minutes;
  row.amountCents += entryAmountCents({ ...entry, isBillable: true });
  if (entry.spentDate < row.oldestDate) row.oldestDate = entry.spentDate;
}

const byOldest = (a: UnbilledTotals & { name: string }, b: UnbilledTotals & { name: string }) =>
  a.oldestDate.localeCompare(b.oldestDate) || a.name.localeCompare(b.name);

/**
 * Unbilled time per client, then per project; the client with the oldest unbilled time first.
 * Amounts are estimates (hours per entry rounded to 0.01), in the client's currency.
 */
export function groupUnbilled(entries: UnbilledEntry[]): UnbilledClientRow[] {
  const clients = new Map<string, UnbilledClientRow & { byProject: Map<string, UnbilledProjectRow> }>();
  for (const entry of entries) {
    const empty = { minutes: 0, amountCents: 0, oldestDate: entry.spentDate };
    let client = clients.get(entry.client.id);
    if (!client) {
      client = { ...entry.client, ...empty, projects: [], byProject: new Map() };
      clients.set(entry.client.id, client);
    }
    let project = client.byProject.get(entry.project.id);
    if (!project) {
      project = { ...entry.project, ...empty };
      client.byProject.set(entry.project.id, project);
    }
    add(client, entry);
    add(project, entry);
  }

  return [...clients.values()]
    .map(({ byProject, ...client }) => ({ ...client, projects: [...byProject.values()].sort(byOldest) }))
    .sort(byOldest);
}

/** Total unbilled hours and amounts per currency. */
export function unbilledSummary(clients: UnbilledClientRow[]): { minutes: number; amount: MoneyByCurrency } {
  const amount: MoneyByCurrency = {};
  let minutes = 0;
  for (const client of clients) {
    minutes += client.minutes;
    if (client.amountCents > 0) amount[client.currency] = (amount[client.currency] ?? 0) + client.amountCents;
  }
  return { minutes, amount };
}

import { toCents } from "@/lib/money";
import { isIsoDate } from "@/features/time/dates";
import { MAX_ENTRY_MINUTES } from "@/features/time/duration";
import { parseCsv } from "./csv-parse";

/* Harvest "Detailed time" report CSV (Reports → Detailed time → Export → CSV). */

export const MAX_IMPORT_BYTES = 5 * 1024 * 1024;
export const MAX_IMPORT_ROWS = 20_000;

/** One valid row of the export. `row` is the data row number (header = row 1). */
export type HarvestRow = {
  row: number;
  date: string;
  client: string;
  project: string;
  projectCode: string | null;
  task: string;
  notes: string | null;
  minutes: number;
  billable: boolean;
  invoiced: boolean;
  rateCents: number | null;
  currency: string | null;
  person: string;
};

export type RowError = { row: number; message: string };

export type HarvestParseResult =
  | { ok: true; rows: HarvestRow[]; errors: RowError[] }
  | { ok: false; error: string };

/** Header → field. Headers are compared lower-cased without spaces or punctuation. */
const COLUMNS = {
  date: "date",
  client: "client",
  project: "project",
  projectCode: "projectcode",
  task: "task",
  notes: "notes",
  hours: "hours",
  billable: "billable",
  invoiced: "invoiced",
  rate: "billablerate",
  currency: "currency",
  firstName: "firstname",
  lastName: "lastname",
} as const;
type Column = keyof typeof COLUMNS;
const REQUIRED: Column[] = ["date", "client", "project", "task", "hours"];
const REQUIRED_LABELS = "Date, Client, Project, Task and Hours";

const LIMITS = { client: 200, project: 200, projectCode: 30, task: 100, notes: 2000 };

function normalizeHeader(header: string): string {
  return header.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function yes(value: string): boolean {
  return ["yes", "true", "1", "y"].includes(value.trim().toLowerCase());
}

/** "1.5", "1,5", "2" → minutes (rounded to the nearest minute); null when not a number. */
export function hoursToMinutes(value: string): number | null {
  const text = value.trim().replace(",", ".");
  if (!/^\d+(\.\d+)?$/.test(text)) return null;
  return Math.round(Number(text) * 60);
}

/** "USD", "United States Dollar - USD", "Euro (EUR)" → the ISO code, else null. */
export function currencyCode(value: string): string | null {
  const match = value.trim().match(/\b([A-Z]{3})\)?$/);
  return match ? match[1] : null;
}

export function parseHarvestCsv(text: string): HarvestParseResult {
  const table = parseCsv(text);
  if (!table) return { ok: false, error: "The file isn't a valid CSV (a quoted value is never closed)." };
  if (table.length < 2) return { ok: false, error: "The file has no time entries." };

  const headers = table[0].map(normalizeHeader);
  const index = Object.fromEntries(
    (Object.keys(COLUMNS) as Column[]).map((column) => [column, headers.indexOf(COLUMNS[column])]),
  ) as Record<Column, number>;
  if (REQUIRED.some((column) => index[column] === -1)) {
    return {
      ok: false,
      error: `This doesn't look like a Harvest detailed time export. It needs the columns ${REQUIRED_LABELS}.`,
    };
  }
  if (table.length - 1 > MAX_IMPORT_ROWS) {
    return {
      ok: false,
      error: `The file has more than ${MAX_IMPORT_ROWS.toLocaleString("en-US")} rows. Export a shorter period (for example one year) and import each file.`,
    };
  }

  const rows: HarvestRow[] = [];
  const errors: RowError[] = [];

  table.slice(1).forEach((cells, i) => {
    const row = i + 2;
    const cell = (column: Column) => (index[column] === -1 ? "" : (cells[index[column]] ?? "").trim());
    const fail = (message: string) => errors.push({ row, message });

    const date = cell("date");
    if (!isIsoDate(date)) return fail(`Date "${date}" isn't in the YYYY-MM-DD format.`);

    const values = { client: cell("client"), project: cell("project"), task: cell("task") };
    for (const [field, value] of Object.entries(values) as [keyof typeof values, string][]) {
      if (!value) return fail(`The ${field} is missing.`);
      if (value.length > LIMITS[field]) return fail(`The ${field} name is longer than ${LIMITS[field]} characters.`);
    }

    const projectCode = cell("projectCode");
    if (projectCode.length > LIMITS.projectCode) {
      return fail(`The project code is longer than ${LIMITS.projectCode} characters.`);
    }
    const notes = cell("notes");
    if (notes.length > LIMITS.notes) return fail(`The notes are longer than ${LIMITS.notes} characters.`);

    const minutes = hoursToMinutes(cell("hours"));
    if (minutes === null) return fail(`Hours "${cell("hours")}" isn't a number.`);
    if (minutes > MAX_ENTRY_MINUTES) return fail("Entries can't be longer than 24 hours.");

    const rate = cell("rate") ? toCents(cell("rate")) : null;
    rows.push({
      row,
      date,
      ...values,
      projectCode: projectCode || null,
      notes: notes || null,
      minutes,
      billable: yes(cell("billable")),
      invoiced: yes(cell("invoiced")),
      rateCents: rate !== null && rate >= 0 ? rate : null,
      currency: currencyCode(cell("currency")),
      person: `${cell("firstName")} ${cell("lastName")}`.trim() || "Unknown",
    });
  });

  return { ok: true, rows, errors };
}

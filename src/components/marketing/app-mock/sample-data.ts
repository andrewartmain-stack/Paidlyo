import { clock } from "./format";

/** Fictional unbilled time for "Acme Co." shared by the invoice mocks. Amounts are integer cents. */
export type MockEntry = { project: string; task: string; minutes: number; rateCents: number };

export const MOCK_ENTRIES: MockEntry[] = [
  { project: "Brand refresh", task: "Design review", minutes: 210, rateCents: 14000 },
  { project: "Brand refresh", task: "Design review", minutes: 150, rateCents: 14000 },
  { project: "Brand refresh", task: "Moodboards", minutes: 180, rateCents: 14000 },
  { project: "Website redesign", task: "Frontend build", minutes: 240, rateCents: 12000 },
  { project: "Website redesign", task: "Frontend build", minutes: 270, rateCents: 12000 },
  { project: "Website redesign", task: "QA", minutes: 90, rateCents: 12000 },
];

export type GroupBy = "task" | "project" | "entry";

export type MockLine = { id: string; description: string; hours: string; rateCents: number; amountCents: number };

export function buildLines(groupBy: GroupBy): MockLine[] {
  const lines = new Map<string, { description: string; minutes: number; rateCents: number; amountCents: number }>();
  MOCK_ENTRIES.forEach((e, i) => {
    const key = groupBy === "entry" ? String(i) : groupBy === "project" ? e.project : `${e.project}|${e.task}`;
    const description =
      groupBy === "project" ? e.project : groupBy === "task" ? `${e.project} - ${e.task}` : `${e.project} - ${e.task} (entry ${i + 1})`;
    const amount = Math.round((e.minutes * e.rateCents) / 60);
    const line = lines.get(key);
    if (line) {
      line.minutes += e.minutes;
      line.amountCents += amount;
    } else {
      lines.set(key, { description, minutes: e.minutes, rateCents: e.rateCents, amountCents: amount });
    }
  });
  return [...lines.entries()].map(([id, l]) => ({
    id,
    description: l.description,
    hours: clock(l.minutes * 60),
    rateCents: l.rateCents,
    amountCents: l.amountCents,
  }));
}

export function computeTotals(lines: MockLine[], discountPercent: number, taxPercent: number) {
  const subtotal = lines.reduce((sum, l) => sum + l.amountCents, 0);
  const discount = Math.round((subtotal * discountPercent) / 100);
  const tax = Math.round(((subtotal - discount) * taxPercent) / 100);
  return { subtotal, discount, tax, total: subtotal - discount + tax };
}

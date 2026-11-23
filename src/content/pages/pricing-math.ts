import { PLAN } from "../pricing";
import type { ToolPrice } from "./schema";

/** Paidlyo's monthly cost for a team, in cents. */
export function paidlyoMonthlyCents(people: number): number {
  return people * PLAN.monthlyCents;
}

/** A competitor's monthly cost for a team, in cents: seats (at least the minimum) plus any base fee. */
export function toolMonthlyCents(tool: Pick<ToolPrice, "perPersonCents" | "baseCents" | "minSeats">, people: number): number {
  return Math.max(people, tool.minSeats) * tool.perPersonCents + tool.baseCents;
}

/** How much Paidlyo saves a team per year against a competitor (negative when it costs more). */
export function yearlySavingCents(tool: Pick<ToolPrice, "perPersonCents" | "baseCents" | "minSeats">, people: number): number {
  return (toolMonthlyCents(tool, people) - paidlyoMonthlyCents(people)) * 12;
}

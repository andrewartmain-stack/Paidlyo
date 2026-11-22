/**
 * Per-person pricing: each active member is one seat; deactivated people and pending invites
 * are free. A subscription always has at least one seat (the owner).
 */
export function seatsToBill(activeMembers: number): number {
  return Math.max(1, Math.floor(activeMembers));
}

/** Whether Stripe's quantity differs from the team (null = Stripe quantity unknown). */
export function seatsOutOfSync(billedSeats: number | null, activeMembers: number): boolean {
  return billedSeats !== null && billedSeats !== seatsToBill(activeMembers);
}

/** Price for all seats, in cents. */
export function seatTotalCents(unitAmountCents: number, seats: number): number {
  return unitAmountCents * seats;
}

/** "1 person", "3 people". */
export function peopleLabel(count: number): string {
  return count === 1 ? "1 person" : `${count} people`;
}

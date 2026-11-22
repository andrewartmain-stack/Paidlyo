import "server-only";
import { getStripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { isLiveStatus } from "./access";
import { getOrgBilling } from "./queries";
import { seatsToBill } from "./seat-count";
import { subscriptionOrgId } from "./stripe-sync";

/** Active members of the organization (RLS: any member can count). */
export async function countActiveMembers(orgId: string): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("organization_members")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", orgId)
    .is("archived_at", null);
  if (error || count === null) throw new Error("Could not count the team.");
  return count;
}

export type SeatStatus = {
  activeMembers: number;
  /** Seats on the Stripe subscription; null when there's no live subscription or Stripe failed. */
  billedSeats: number | null;
};

/** The live subscription's first item, if it belongs to this organization. */
async function liveSubscriptionItem(orgId: string) {
  const billing = await getOrgBilling(orgId);
  if (!billing?.stripeSubscriptionId || !isLiveStatus(billing.status)) return null;
  const subscription = await getStripe().subscriptions.retrieve(billing.stripeSubscriptionId);
  if (subscriptionOrgId(subscription) !== orgId) return null;
  return subscription.items.data[0] ?? null;
}

/** Team size vs. the seats Stripe bills for (billing page). */
export async function getSeatStatus(orgId: string): Promise<SeatStatus> {
  const activeMembers = await countActiveMembers(orgId);
  try {
    const item = await liveSubscriptionItem(orgId);
    return { activeMembers, billedSeats: item?.quantity ?? null };
  } catch (error) {
    console.error("Failed to read Stripe seats", error);
    return { activeMembers, billedSeats: null };
  }
}

/**
 * Sets the subscription quantity to the number of active members. Stripe prorates the change
 * on the next invoice (free during the trial). Never throws: a failed sync is logged and
 * corrected by the next team change or "Sync seats" on the billing page.
 */
export async function syncSeats(orgId: string): Promise<boolean> {
  try {
    const [item, activeMembers] = await Promise.all([liveSubscriptionItem(orgId), countActiveMembers(orgId)]);
    if (!item) return true;
    const seats = seatsToBill(activeMembers);
    if (item.quantity === seats) return true;
    await getStripe().subscriptionItems.update(item.id, { quantity: seats, proration_behavior: "create_prorations" });
    return true;
  } catch (error) {
    console.error("Failed to sync Stripe seats", error);
    return false;
  }
}

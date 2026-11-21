import "server-only";
import { billingAccess, canWrite, type BillingAccess } from "./access";
import { getOrgBilling } from "./queries";

/** The message shown when an account without a working subscription tries to change data. */
export function readOnlyMessage(access: BillingAccess): string | null {
  if (canWrite(access)) return null;
  return access.kind === "none"
    ? "Start your free trial to use Paidlyo."
    : "Your subscription has ended. Subscribe in Settings → Billing to keep working.";
}

/**
 * Call at the start of every Server Action that changes business data. Returns the error to show
 * when the organization can't change data (no subscription yet, or it ended), otherwise null.
 * A missing billing row never locks anyone out.
 */
export async function writeBlocked(organizationId: string): Promise<string | null> {
  const billing = await getOrgBilling(organizationId);
  if (!billing) return null;
  return readOnlyMessage(billingAccess(billing, new Date()));
}

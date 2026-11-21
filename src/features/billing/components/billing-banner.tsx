import Link from "next/link";
import { redirect } from "next/navigation";
import { canManageOrg, findCurrentOrg } from "@/features/organizations/queries";
import { billingAccess, mustSubscribe, needsAttention, type BillingAccess } from "../access";
import { getOrgBilling } from "../queries";

function bannerText(access: BillingAccess): string {
  switch (access.kind) {
    case "trialing":
      return access.daysLeft <= 1
        ? "Your free trial ends today, then your card is charged automatically."
        : `Your free trial ends in ${access.daysLeft} days, then your card is charged automatically.`;
    case "past_due":
      return "Your last payment didn't go through.";
    case "expired":
      return "Your subscription has ended, so your account is read-only.";
    default:
      return "";
  }
}

/**
 * App-wide billing check, rendered in the app shell inside <Suspense>.
 * Sends organizations that never subscribed to /subscribe (the trial needs a card), and shows a
 * banner for a trial that's about to end, a failed payment or an ended subscription.
 */
export async function BillingBanner() {
  const org = await findCurrentOrg();
  if (!org) return null;
  const billing = await getOrgBilling(org.id);
  if (!billing) return null;

  const access = billingAccess(billing, new Date());
  if (mustSubscribe(access)) redirect("/subscribe");
  if (!needsAttention(access)) return null;

  const urgent = access.kind !== "trialing";
  return (
    <div
      role="status"
      className={
        urgent
          ? "border-b bg-warning/10 px-4 py-2.5 text-sm text-warning md:px-8 print:hidden"
          : "border-b bg-muted px-4 py-2.5 text-sm md:px-8 print:hidden"
      }
    >
      {bannerText(access)}{" "}
      {canManageOrg(org) ? (
        <Link href="/app/settings/billing" className="font-medium underline underline-offset-4">
          {access.kind === "trialing" ? "Manage billing" : access.kind === "past_due" ? "Update payment" : "Subscribe"}
        </Link>
      ) : (
        <span>Ask the account owner to update billing.</span>
      )}
    </div>
  );
}

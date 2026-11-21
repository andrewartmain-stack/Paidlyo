import { getCurrentOrg } from "../queries";

/**
 * Organization name for the app shell. Also the onboarding guard: getCurrentOrg()
 * redirects users without an organization to /onboarding. Render inside <Suspense>.
 */
export async function OrgName({ className }: { className?: string }) {
  const org = await getCurrentOrg();
  return <p className={className}>{org.name}</p>;
}

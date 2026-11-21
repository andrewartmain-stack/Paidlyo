import { getCurrentUser } from "../queries";
import { AccountMenuDropdown } from "./account-menu-dropdown";

/** Reads the session — render inside <Suspense fallback={<AccountMenuSkeleton />}>. */
export async function AccountMenu({ compact = false }: { compact?: boolean }) {
  const user = await getCurrentUser();
  return <AccountMenuDropdown user={user} compact={compact} />;
}

export function AccountMenuSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <div aria-hidden className={compact ? "p-1" : "flex items-center gap-3 px-3 py-2"}>
      <span className={compact ? "block size-8 rounded-full bg-muted" : "size-8 rounded-full bg-sidebar-accent"} />
      {!compact && <span className="h-4 flex-1 rounded-sm bg-sidebar-accent" />}
    </div>
  );
}

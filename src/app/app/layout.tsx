import type { Metadata } from "next";
import { Suspense } from "react";
import { Logo } from "@/components/app-shell/logo";
import { MobileNav } from "@/components/app-shell/mobile-nav";
import { SidebarNav } from "@/components/app-shell/sidebar-nav";
import { TrackTimeButton } from "@/components/app-shell/track-time-button";
import { AccountMenu, AccountMenuSkeleton } from "@/features/auth/components/account-menu";
import { BillingBanner } from "@/features/billing/components/billing-banner";
import { OrgName } from "@/features/organizations/components/org-name";

// The dashboard is private: never indexed. Access: proxy.ts + getCurrentUser;
// OrgName (via getCurrentOrg) sends users without an organization to /onboarding.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AppLayout({ children }: LayoutProps<"/app">) {
  return (
    <div className="flex min-h-svh flex-1">
      <aside className="sticky top-0 hidden h-svh w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex print:hidden!">
        <div className="flex flex-col gap-5 px-3 pt-5 pb-5">
          <div className="flex flex-col gap-2 px-3">
            <Logo className="self-start" />
            <Suspense fallback={<span className="h-4 w-28 rounded-sm bg-sidebar-accent" />}>
              <OrgName className="truncate text-xs font-medium text-sidebar-muted-foreground" />
            </Suspense>
          </div>
          <TrackTimeButton />
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-4">
          <SidebarNav />
        </div>

        <div className="flex flex-col gap-1 border-t border-sidebar-border px-3 py-3">
          <SidebarNav section="footer" />
          <Suspense fallback={<AccountMenuSkeleton />}>
            <AccountMenu />
          </Suspense>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center gap-2 border-b bg-background px-4 md:hidden print:hidden">
          <MobileNav />
          <Logo />
          <div className="ml-auto">
            <Suspense fallback={<AccountMenuSkeleton compact />}>
              <AccountMenu compact />
            </Suspense>
          </div>
        </header>
        <Suspense fallback={null}>
          <BillingBanner />
        </Suspense>
        <main className="flex-1 px-4 py-6 md:px-8 md:py-8 print:p-0">{children}</main>
      </div>
    </div>
  );
}

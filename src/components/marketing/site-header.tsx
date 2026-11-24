import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Logo } from "@/components/app-shell/logo";
import { NAV_GROUPS, NAV_PLAIN_LINKS } from "@/content/landing";
import { audiencePaths } from "@/content/pages";
import { MarketingMobileNav } from "./mobile-nav";
import type { ResolvedNavGroup } from "./nav-icons";
import { MarketingNavMenu } from "./nav-menu";
import { HeaderScrollShell } from "./scroll-shell";

const AUDIENCE_FALLBACK = "/#who-its-for";

/** Resolve audience slugs to published pages (fallback: the landing section). */
async function resolveGroups(): Promise<ResolvedNavGroup[]> {
  const paths = await audiencePaths();
  return NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.map(({ href, audienceSlug, ...item }) => ({
      ...item,
      href: href ?? (audienceSlug ? paths.get(audienceSlug) : undefined) ?? AUDIENCE_FALLBACK,
    })),
  }));
}

/** Public site header: floating glass pill. Static: no session reads; CMS data is cached, so pages stay prerendered. */
export async function SiteHeader() {
  const GROUPS = await resolveGroups();
  return (
    <header className="sticky top-3 z-50 px-4">
      <HeaderScrollShell>
        <Logo href="/" animated className="flex shrink-0 items-center justify-self-start" />
        <MarketingNavMenu groups={GROUPS} links={NAV_PLAIN_LINKS} />
        <div className="hidden items-center justify-self-end gap-1 lg:flex">
          <Link href="/login" className={buttonVariants({ variant: "ghost", className: "rounded-full" })}>
            Log in
          </Link>
          <Link href="/signup" className={buttonVariants({ className: "rounded-full" })}>
            Get started
          </Link>
        </div>
        <MarketingMobileNav groups={GROUPS} links={NAV_PLAIN_LINKS} />
      </HeaderScrollShell>
    </header>
  );
}

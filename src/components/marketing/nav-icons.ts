import {
  ArrowLeftRight,
  BadgeCheck,
  BookOpen,
  Briefcase,
  Building2,
  ChartColumn,
  Layers,
  Clock,
  Download,
  FileText,
  LayoutGrid,
  Scale,
  Store,
  User,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import type { NavGroup, NavIconKey, NavItem, NavLink } from "@/content/landing";

export const NAV_ICONS: Record<NavIconKey, LucideIcon> = {
  clock: Clock,
  invoice: FileText,
  chart: ChartColumn,
  approval: BadgeCheck,
  rates: UsersRound,
  import: Download,
  agency: Building2,
  consultancy: Briefcase,
  freelancer: User,
  business: Store,
  bundle: Layers,
  guide: BookOpen,
  compare: Scale,
  switch: ArrowLeftRight,
  features: LayoutGrid,
};

export type ResolvedNavItem = Omit<NavItem, "href" | "livePath" | "fallback"> & { href: string };
export type ResolvedNavGroup = Omit<NavGroup, "items" | "footer"> & { items: ResolvedNavItem[]; footer?: NavLink };

/**
 * Turn the nav config into links for what exists now: an item with `livePath` links there once
 * that page is published, else to its `fallback`, else it's hidden. Groups left empty are dropped.
 */
export function resolveNavGroups(groups: NavGroup[], live: Set<string>): ResolvedNavGroup[] {
  const target = (link: { href?: string; livePath?: string; fallback?: string }) =>
    link.livePath ? (live.has(link.livePath) ? link.livePath : link.fallback) : link.href;
  return groups.flatMap(({ items, footer, ...group }) => {
    const resolved = items.flatMap(({ href, livePath, fallback, ...item }) => {
      const to = target({ href, livePath, fallback });
      return to ? [{ ...item, href: to }] : [];
    });
    if (resolved.length === 0) return [];
    const footerHref = footer && target(footer);
    return [{ ...group, items: resolved, ...(footer && footerHref && { footer: { label: footer.label, href: footerHref } }) }];
  });
}

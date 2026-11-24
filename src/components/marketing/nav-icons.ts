import {
  ArrowLeftRight,
  BadgeCheck,
  BookOpen,
  Briefcase,
  Building2,
  ChartColumn,
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
import { INDEX_PATHS } from "@/content/pages/paths";

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
  guide: BookOpen,
  compare: Scale,
  switch: ArrowLeftRight,
  features: LayoutGrid,
};

export type ResolvedNavItem = Omit<NavItem, "href" | "audienceSlug" | "index"> & { href: string };
export type ResolvedNavGroup = Omit<NavGroup, "items" | "footer"> & { items: ResolvedNavItem[]; footer?: NavLink };

type IndexKey = keyof typeof INDEX_PATHS;

/** Where audience items go before their page exists. */
export const AUDIENCE_FALLBACK = "/#who-its-for";

/**
 * Turn the nav config into links: audience items point to their page (or the landing section),
 * index items and footers appear only once their index page has a published page, and a group
 * left with no items is dropped.
 */
export function resolveNavGroups(
  groups: NavGroup[],
  { audiencePaths, liveIndexes }: { audiencePaths: Map<string, string>; liveIndexes: Set<IndexKey> },
): ResolvedNavGroup[] {
  return groups.flatMap(({ items, footer, ...group }) => {
    const resolved = items.flatMap(({ href, audienceSlug, index, ...item }) => {
      if (index) return liveIndexes.has(index) ? [{ ...item, href: INDEX_PATHS[index] }] : [];
      return [{ ...item, href: href ?? (audienceSlug ? audiencePaths.get(audienceSlug) : undefined) ?? AUDIENCE_FALLBACK }];
    });
    if (resolved.length === 0) return [];
    const footerHref = footer?.index ? (liveIndexes.has(footer.index) ? INDEX_PATHS[footer.index] : undefined) : footer?.href;
    return [{ ...group, items: resolved, ...(footer && footerHref && { footer: { label: footer.label, href: footerHref } }) }];
  });
}

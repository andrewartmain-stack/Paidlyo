import {
  BadgeCheck,
  Briefcase,
  Building2,
  ChartColumn,
  Clock,
  Download,
  FileText,
  Store,
  User,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import type { NavGroup, NavIconKey, NavItem } from "@/content/landing";

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
};

export type ResolvedNavItem = Omit<NavItem, "href" | "audienceSlug"> & { href: string };
export type ResolvedNavGroup = Omit<NavGroup, "items"> & { items: ResolvedNavItem[] };

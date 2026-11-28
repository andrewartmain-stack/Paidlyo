import {
  ArrowLeftRight,
  BadgeCheck,
  BookOpen,
  Briefcase,
  Building2,
  Calculator,
  CalendarDays,
  ChartColumn,
  CircleDollarSign,
  Clapperboard,
  Cloud,
  Code,
  Coins,
  DraftingCompass,
  Layers,
  Clock,
  Download,
  FileText,
  FolderKanban,
  Gavel,
  Globe,
  HardHat,
  Headset,
  HeartHandshake,
  Laptop,
  LayoutGrid,
  MapPin,
  MessagesSquare,
  Monitor,
  Palette,
  PiggyBank,
  Scale,
  Store,
  Tag,
  Terminal,
  Timer,
  User,
  UserPlus,
  UsersRound,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import type { NavIconKey } from "@/content/landing";

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

/** Icons for page slugs (last URL segment) in the menus; unknown slugs fall back by section. */
const SLUG_ICONS: Record<string, LucideIcon> = {
  // Audiences
  agencies: Building2,
  consultants: Briefcase,
  freelancers: User,
  "small-business": Store,
  accountants: Calculator,
  architects: DraftingCompass,
  "law-firms": Gavel,
  designers: Palette,
  developers: Code,
  engineers: Wrench,
  contractors: HardHat,
  "remote-teams": Globe,
  "virtual-assistants": Headset,
  coaches: MessagesSquare,
  "staffing-agencies": UserPlus,
  studios: Clapperboard,
  nonprofits: HeartHandshake,
  // Features
  timer: Timer,
  timesheets: CalendarDays,
  reports: ChartColumn,
  "billable-hours": CircleDollarSign,
  "project-time-tracking": FolderKanban,
  "multi-currency": Coins,
  "project-budgets": PiggyBank,
  approvals: BadgeCheck,
  // Variants
  online: Cloud,
  mac: Laptop,
  "windows-desktop": Monitor,
  linux: Terminal,
  uk: MapPin,
  canada: MapPin,
  "australia-nz": MapPin,
  "south-africa": MapPin,
};

/** Icon for a page link in the header menu, picked from its URL. */
export function linkIcon(href: string): LucideIcon {
  const parts = href.split("/").filter(Boolean);
  const slug = parts.at(-1) ?? "";
  if (parts[0] === "alternatives") return ArrowLeftRight;
  if (parts[0] === "compare") return slug.endsWith("-pricing") ? Tag : Scale;
  if (parts[0] === "guides") return BookOpen;
  return SLUG_ICONS[slug] ?? FileText;
}

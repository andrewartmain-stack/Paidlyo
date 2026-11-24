import {
  Banknote,
  Briefcase,
  Building2,
  CalendarDays,
  ChartColumn,
  CircleCheck,
  Clock,
  Download,
  FileText,
  FolderKanban,
  Globe,
  Lightbulb,
  Link2,
  Lock,
  Mail,
  Percent,
  PiggyBank,
  ReceiptText,
  Search,
  Timer,
  TriangleAlert,
  Upload,
  User,
  UsersRound,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { CardIconKey } from "@/content/pages/icons";
import { cn } from "@/lib/utils";

export const CARD_ICON_COMPONENTS: Record<CardIconKey, LucideIcon> = {
  clock: Clock,
  timer: Timer,
  calendar: CalendarDays,
  invoice: FileText,
  receipt: ReceiptText,
  wallet: Wallet,
  money: Banknote,
  percent: Percent,
  chart: ChartColumn,
  budget: PiggyBank,
  users: UsersRound,
  user: User,
  building: Building2,
  briefcase: Briefcase,
  folder: FolderKanban,
  check: CircleCheck,
  alert: TriangleAlert,
  idea: Lightbulb,
  link: Link2,
  import: Download,
  export: Upload,
  lock: Lock,
  globe: Globe,
  mail: Mail,
  search: Search,
};

/** A card's icon in a tinted chip. Decorative: the card's title carries the meaning. */
export function CardIcon({ icon, className }: { icon: CardIconKey; className?: string }) {
  const Icon = CARD_ICON_COMPONENTS[icon];
  return (
    <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent text-brand", className)}>
      <Icon className="size-5" aria-hidden />
    </span>
  );
}

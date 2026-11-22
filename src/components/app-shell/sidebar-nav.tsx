"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  ClipboardCheck,
  Clock,
  FileText,
  FolderKanban,
  LayoutDashboard,
  ListChecks,
  Settings,
  Users,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Not built yet: shown with a "Soon" tag and not clickable. Remove when the feature lands. */
  soon?: boolean;
};
type NavGroup = { label?: string; items: NavItem[] };

const mainNav: NavGroup[] = [
  {
    items: [
      { href: "/app", label: "Dashboard", icon: LayoutDashboard },
      { href: "/app/time", label: "Timesheet", icon: Clock },
      { href: "/app/invoices", label: "Invoices", icon: FileText },
      { href: "/app/reports", label: "Reports", icon: BarChart3 },
    ],
  },
  {
    label: "Manage",
    items: [
      { href: "/app/team", label: "Team", icon: UsersRound },
      { href: "/app/approvals", label: "Approvals", icon: ClipboardCheck },
      { href: "/app/clients", label: "Clients", icon: Users },
      { href: "/app/projects", label: "Projects", icon: FolderKanban },
      { href: "/app/tasks", label: "Tasks", icon: ListChecks },
    ],
  },
];

const footerNav: NavGroup[] = [{ items: [{ href: "/app/settings", label: "Settings", icon: Settings }] }];

function isActive(pathname: string, href: string) {
  if (href === "/app") return pathname === "/app";
  return pathname === href || pathname.startsWith(`${href}/`);
}

const itemClass =
  "group/nav flex h-9 items-center gap-3 rounded-full px-3 text-sm text-sidebar-foreground outline-none transition-colors duration-200";

type SidebarNavProps = { section?: "main" | "footer"; onNavigate?: () => void };

/**
 * Sidebar links. The active link depends on the URL, which isn't known while prerendering
 * dynamic routes (e.g. /app/projects/[id]/edit), so the same nav without highlighting is
 * shown as the Suspense fallback.
 */
export function SidebarNav(props: SidebarNavProps) {
  return (
    <Suspense fallback={<NavList {...props} pathname={null} />}>
      <ActiveSidebarNav {...props} />
    </Suspense>
  );
}

function ActiveSidebarNav(props: SidebarNavProps) {
  const pathname = usePathname();
  return <NavList {...props} pathname={pathname} />;
}

function NavList({
  section = "main",
  onNavigate,
  pathname,
}: SidebarNavProps & { pathname: string | null }) {
  const groups = section === "main" ? mainNav : footerNav;

  return (
    <nav aria-label={section === "main" ? "Main" : "Workspace"} className="flex flex-col gap-6">
      {groups.map((group, index) => (
        <div key={group.label ?? index} className="flex flex-col gap-1">
          {group.label && (
            <p className="px-3 pb-1 text-[0.6875rem] font-semibold tracking-wider text-sidebar-muted-foreground uppercase">
              {group.label}
            </p>
          )}
          {group.items.map(({ href, label, icon: Icon, soon }) => {
            if (soon) {
              return (
                <span
                  key={href}
                  aria-disabled="true"
                  className={cn(itemClass, "cursor-default text-sidebar-muted-foreground/80")}
                >
                  <Icon className="size-4 shrink-0 opacity-70" aria-hidden />
                  {label}
                  <span className="ml-auto rounded-full bg-sidebar-accent/70 px-1.5 text-[0.625rem] leading-4 font-medium tracking-wide uppercase">
                    Soon
                  </span>
                </span>
              );
            }

            const active = pathname !== null && isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(
                  itemClass,
                  "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  "focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar",
                  active &&
                    // Tinted fill + evergreen text; no ring, shadow or side bar.
                    "bg-sidebar-active font-medium text-sidebar-active-foreground hover:bg-sidebar-active hover:text-sidebar-active-foreground",
                )}
              >
                <Icon
                  className={cn(
                    "size-[1.125rem] shrink-0 text-sidebar-muted-foreground transition-transform duration-200 motion-safe:group-hover/nav:scale-110",
                    active && "text-sidebar-active-foreground",
                  )}
                  aria-hidden
                />
                {label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

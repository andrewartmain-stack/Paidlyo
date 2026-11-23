import {
  BarChart3,
  ClipboardCheck,
  Clock,
  FileText,
  FolderKanban,
  LayoutDashboard,
  Timer,
  Users,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import logo from "../../../../public/logo.png";

const NAV: { group?: string; items: { label: string; icon: LucideIcon }[] }[] = [
  {
    items: [
      { label: "Dashboard", icon: LayoutDashboard },
      { label: "Timesheet", icon: Clock },
      { label: "Invoices", icon: FileText },
      { label: "Reports", icon: BarChart3 },
    ],
  },
  {
    group: "Manage",
    items: [
      { label: "Team", icon: UsersRound },
      { label: "Approvals", icon: ClipboardCheck },
      { label: "Clients", icon: Users },
      { label: "Projects", icon: FolderKanban },
    ],
  },
];

export type MockNavLabel = "Dashboard" | "Timesheet" | "Invoices" | "Reports";

type MockWindowProps = {
  children: React.ReactNode;
  /** One-line description read by screen readers before the mock. */
  description: string;
  /** Highlighted sidebar item. */
  active?: MockNavLabel;
  /** Show the app sidebar (only appears when the window is wide enough). Default true. */
  sidebar?: boolean;
  url?: string;
  className?: string;
};

/**
 * Browser-like frame around a coded mock of the Paidlyo app. Fluid: the sidebar appears
 * from ~576px of window width (container query), so it works in narrow spaces too.
 */
export function MockWindow({ children, description, active, sidebar = true, url = "paidlyo.com/app", className }: MockWindowProps) {
  return (
    <div className={cn("@container w-full text-foreground", className)}>
      <p className="sr-only">{description}</p>
      <div className="overflow-hidden rounded-xl border bg-background shadow-2xl shadow-brand/20">
        <div className="relative flex h-8 items-center border-b bg-background px-3" aria-hidden="true">
          <div className="flex gap-1.5">
            <span className="size-2 rounded-full bg-border" />
            <span className="size-2 rounded-full bg-border" />
            <span className="size-2 rounded-full bg-border" />
          </div>
          <span className="absolute left-1/2 -translate-x-1/2 rounded-full bg-muted px-4 py-0.5 text-[10px] text-muted-foreground">{url}</span>
        </div>
        <div className="flex">
          {sidebar && (
            <aside aria-hidden="true" className="hidden w-36 shrink-0 flex-col justify-between border-r p-2.5 select-none @xl:flex">
              <div className="flex flex-col gap-3">
                <div className="px-1 pt-1">
                  <Image src={logo} alt="" className="h-4 w-auto" />
                  <p className="mt-1 text-[9px] text-muted-foreground">Northpeak Studio</p>
                </div>
                <div className="flex h-7 items-center justify-center gap-1.5 rounded-full bg-primary text-[11px] font-medium text-primary-foreground">
                  <Timer className="size-3" />
                  Track time
                </div>
                {NAV.map((group, i) => (
                  <div key={i} className="flex flex-col gap-0.5">
                    {group.group && (
                      <p className="px-2 pt-1 pb-0.5 text-[8px] font-semibold tracking-wider text-muted-foreground uppercase">{group.group}</p>
                    )}
                    {group.items.map(({ label, icon: Icon }) => (
                      <div
                        key={label}
                        className={cn(
                          "flex h-6 items-center gap-2 rounded-full px-2 text-[11px]",
                          label === active ? "bg-sidebar-active font-medium text-sidebar-active-foreground" : "text-sidebar-foreground",
                        )}
                      >
                        <Icon className={cn("size-3", label !== active && "text-muted-foreground")} />
                        {label}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 border-t px-1 pt-2">
                <span className="flex size-5 items-center justify-center rounded-full bg-accent text-[8px] font-semibold text-accent-foreground">AA</span>
                <span className="text-[10px] leading-tight">
                  Andrew
                  <span className="block text-[9px] text-muted-foreground">Owner</span>
                </span>
              </div>
            </aside>
          )}
          <div className="min-w-0 flex-1 p-3 @md:p-4">{children}</div>
        </div>
      </div>
    </div>
  );
}

"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronRight } from "lucide-react";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import type { NavLink } from "@/content/landing";
import type { DirectoryGroup } from "@/content/pages/directory";
import { cn } from "cn";
import { linkIcon, NAV_ICONS } from "./nav-icons";

type NavMenuProps = { groups: DirectoryGroup[]; links: NavLink[] };

/**
 * One dropdown: its sections on the left; hovering or focusing one shows its pages on the right.
 * A group with a single section shows its pages straight away.
 */
function GroupPanel({ group }: { group: DirectoryGroup }) {
  const [active, setActive] = useState(0);
  const section = group.sections[active] ?? group.sections[0];
  const single = group.sections.length === 1;

  return (
    <div className={cn("grid gap-2", single ? "w-[26rem]" : "w-[46rem] grid-cols-[16rem_1fr]")}>
      {!single && (
        <ul className="flex flex-col gap-0.5 border-r pr-2" aria-label={group.label}>
          {group.sections.map((item, index) => {
            const Icon = NAV_ICONS[item.icon];
            return (
              <li key={item.title}>
                <button
                  type="button"
                  onMouseEnter={() => setActive(index)}
                  onFocus={() => setActive(index)}
                  onClick={() => setActive(index)}
                  aria-current={index === active ? "true" : undefined}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg p-2 text-left outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring",
                    index === active && "bg-muted",
                  )}
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-background text-foreground">
                    <Icon aria-hidden="true" className="size-4" />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="font-heading text-sm font-medium text-foreground">{item.title}</span>
                    <span className="truncate text-xs text-muted-foreground">{item.description}</span>
                  </span>
                  <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <div className="flex min-w-0 flex-col p-1">
        <p className="px-2 pb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">{section.title}</p>
        {section.links.length > 0 && (
          <ul className={cn("grid gap-0.5", section.links.length > 4 && !single && "grid-cols-2")}>
            {section.links.map((link) => {
              const Icon = linkIcon(link.href);
              return (
                <li key={link.href}>
                  <NavigationMenuLink render={<Link href={link.href} />} className="flex-row items-center gap-2 px-2 py-1.5 text-sm text-foreground">
                    <Icon aria-hidden="true" className="size-4 shrink-0 text-foreground" />
                    <span className="min-w-0">{link.label}</span>
                  </NavigationMenuLink>
                </li>
              );
            })}
          </ul>
        )}
        {section.all && (
          <div className="mt-auto border-t pt-1">
            <NavigationMenuLink
              render={<Link href={section.all.href} />}
              className="mt-1 items-center justify-between px-2 py-2 text-sm font-medium text-brand"
            >
              {section.more > 0 ? `${section.all.label} (${section.links.length + section.more})` : section.all.label}
              <ArrowRight aria-hidden="true" className="size-4" />
            </NavigationMenuLink>
          </div>
        )}
      </div>
    </div>
  );
}

/** Desktop navigation: dropdown groups (Base UI navigation menu) plus plain links. */
export function MarketingNavMenu({ groups, links }: NavMenuProps) {
  return (
    <NavigationMenu aria-label="Main" className="hidden lg:flex">
      <NavigationMenuList>
        {groups.map((group) => (
          <NavigationMenuItem key={group.label}>
            <NavigationMenuTrigger>{group.label}</NavigationMenuTrigger>
            <NavigationMenuContent>
              <GroupPanel group={group} />
            </NavigationMenuContent>
          </NavigationMenuItem>
        ))}
        {links.map((link) => (
          <NavigationMenuItem key={link.href}>
            <NavigationMenuLink render={<Link href={link.href} />} className={navigationMenuTriggerStyle()}>
              {link.label}
            </NavigationMenuLink>
          </NavigationMenuItem>
        ))}
      </NavigationMenuList>
    </NavigationMenu>
  );
}

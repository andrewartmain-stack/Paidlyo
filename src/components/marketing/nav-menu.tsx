"use client";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
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
import { cn } from "cn";
import { NAV_ICONS, type ResolvedNavGroup } from "./nav-icons";

type NavMenuProps = { groups: ResolvedNavGroup[]; links: NavLink[] };

/** Desktop navigation: dropdown groups (Base UI navigation menu) plus plain links. */
export function MarketingNavMenu({ groups, links }: NavMenuProps) {
  return (
    <NavigationMenu aria-label="Main" className="hidden lg:flex">
      <NavigationMenuList>
        {groups.map((group) => (
          <NavigationMenuItem key={group.label}>
            <NavigationMenuTrigger>{group.label}</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className={cn("grid gap-1", group.columns === 2 ? "w-[34rem] grid-cols-2" : "w-80")}>
                {group.items.map((item) => {
                  const Icon = NAV_ICONS[item.icon];
                  return (
                    <li key={item.title}>
                      <NavigationMenuLink render={<Link href={item.href} />}>
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-brand">
                          <Icon aria-hidden="true" className="size-4" />
                        </span>
                        <span className="flex flex-col gap-0.5">
                          <span className="font-heading font-medium text-foreground">{item.title}</span>
                          <span className="text-xs text-muted-foreground">{item.description}</span>
                        </span>
                      </NavigationMenuLink>
                    </li>
                  );
                })}
              </ul>
              {group.footer ? (
                <div className="mt-2 border-t pt-2">
                  <NavigationMenuLink
                    render={<Link href={group.footer.href} />}
                    className="items-center justify-between py-2 font-medium text-brand"
                  >
                    {group.footer.label}
                    <ArrowRight aria-hidden="true" className="size-4" />
                  </NavigationMenuLink>
                </div>
              ) : null}
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

"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { NavLink } from "@/content/landing";
import { NAV_ICONS, type ResolvedNavGroup } from "./nav-icons";

type MobileNavProps = { groups: ResolvedNavGroup[]; links: NavLink[] };

const ROW =
  "rounded-xl outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring";

/** Phone menu for the public site: groups with icons, plain links, Log in / Get started. */
export function MarketingMobileNav({ groups, links }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={<Button variant="ghost" size="icon" aria-label="Open menu" className="justify-self-end rounded-full lg:hidden" />}
      >
        <Menu />
      </SheetTrigger>
      <SheetContent side="right" className="w-80 gap-4 overflow-y-auto p-5">
        <SheetHeader className="p-0">
          <SheetTitle className="text-base">Menu</SheetTitle>
        </SheetHeader>
        <nav aria-label="Main" className="flex flex-col gap-5">
          {groups.map((group) => (
            <section key={group.label} aria-label={group.label}>
              <h2 className="px-2 pb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {group.label}
              </h2>
              <ul className="flex flex-col">
                {group.items.map((item) => {
                  const Icon = NAV_ICONS[item.icon];
                  return (
                    <li key={item.title}>
                      <Link href={item.href} onClick={close} className={`flex items-start gap-3 p-2 ${ROW}`}>
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-brand">
                          <Icon aria-hidden="true" className="size-4" />
                        </span>
                        <span className="flex flex-col">
                          <span className="font-heading text-sm font-medium">{item.title}</span>
                          <span className="text-xs text-muted-foreground">{item.description}</span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
              {group.footer && (
                <Link href={group.footer.href} onClick={close} className={`block px-2 py-2 text-sm font-medium text-brand ${ROW}`}>
                  {group.footer.label}
                </Link>
              )}
            </section>
          ))}
          <ul className="flex flex-col border-t pt-3">
            {links.map((link) => (
              <li key={link.href}>
                <Link href={link.href} onClick={close} className={`block px-2 py-2 text-base ${ROW}`}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="mt-auto flex flex-col gap-2">
          <Link href="/signup" onClick={close} className={buttonVariants({ size: "lg" })}>
            Get started
          </Link>
          <Link href="/login" onClick={close} className={buttonVariants({ variant: "outline", size: "lg" })}>
            Log in
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  );
}

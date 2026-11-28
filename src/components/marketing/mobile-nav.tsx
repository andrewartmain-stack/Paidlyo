"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, Menu } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { NavLink } from "@/content/landing";
import type { DirectoryGroup } from "@/content/pages/directory";
import { linkIcon, NAV_ICONS } from "./nav-icons";

type MobileNavProps = { groups: DirectoryGroup[]; links: NavLink[] };

const ROW =
  "rounded-xl outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring";

/** Phone menu for the public site: each group's sections fold open to their pages. */
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
                {group.sections.map((section) => {
                  const Icon = NAV_ICONS[section.icon];
                  return (
                    <li key={section.title}>
                      <details className="group/section">
                        <summary className={`flex cursor-pointer list-none items-center gap-3 p-2 [&::-webkit-details-marker]:hidden ${ROW}`}>
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-background text-foreground">
                            <Icon aria-hidden="true" className="size-4" />
                          </span>
                          <span className="flex-1 font-heading text-sm font-medium">{section.title}</span>
                          <ChevronDown
                            aria-hidden="true"
                            className="size-4 text-muted-foreground transition-transform group-open/section:rotate-180"
                          />
                        </summary>
                        <ul className="mb-2 ml-[1.375rem] flex flex-col border-l pl-3">
                          {section.links.map((link) => {
                            const LinkIcon = linkIcon(link.href);
                            return (
                              <li key={link.href}>
                                <Link href={link.href} onClick={close} className={`flex items-center gap-2 px-2 py-1.5 text-sm ${ROW}`}>
                                  <LinkIcon aria-hidden="true" className="size-4 shrink-0 text-foreground" />
                                  {link.label}
                                </Link>
                              </li>
                            );
                          })}
                          {section.all && (
                            <li>
                              <Link href={section.all.href} onClick={close} className={`block px-2 py-1.5 text-sm font-medium text-brand ${ROW}`}>
                                {section.all.label}
                              </Link>
                            </li>
                          )}
                        </ul>
                      </details>
                    </li>
                  );
                })}
              </ul>
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

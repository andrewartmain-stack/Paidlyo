"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { NAV_LINKS } from "@/content/landing";
import { cn } from "@/lib/utils";

/** Phone menu for the public site: section links plus Log in / Get started. */
export function MarketingMobileNav() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button variant="ghost" size="icon" aria-label="Open menu" className="md:hidden" />}>
        <Menu />
      </SheetTrigger>
      <SheetContent side="right" className="w-72 gap-6 p-6">
        <SheetHeader className="p-0">
          <SheetTitle className="text-base">Menu</SheetTitle>
        </SheetHeader>
        <nav aria-label="Main" className="flex flex-col gap-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={close}
              className="rounded-md px-2 py-2 text-base text-foreground outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto flex flex-col gap-2">
          <Link href="/signup" onClick={close} className={buttonVariants({ size: "lg" })}>
            Get started
          </Link>
          <Link href="/login" onClick={close} className={cn(buttonVariants({ variant: "outline", size: "lg" }))}>
            Log in
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  );
}

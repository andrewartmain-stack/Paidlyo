"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Logo } from "./logo";
import { SidebarNav } from "./sidebar-nav";
import { TrackTimeButton } from "./track-time-button";

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button variant="ghost" size="icon" aria-label="Open menu" />}>
        <Menu />
      </SheetTrigger>
      <SheetContent side="left" className="w-72 gap-4 overflow-y-auto bg-sidebar p-4">
        <SheetHeader className="p-0 pb-2">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <Logo className="self-start px-2.5" onClick={() => setOpen(false)} />
        </SheetHeader>
        <TrackTimeButton onNavigate={() => setOpen(false)} />
        <SidebarNav onNavigate={() => setOpen(false)} />
        <div className="border-t border-sidebar-border pt-3">
          <SidebarNav section="footer" onNavigate={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}

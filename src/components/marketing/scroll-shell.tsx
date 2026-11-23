"use client";

import { useEffect, useState, type ReactNode } from "react";
import { cn } from "cn";

/** Tiny client island: makes the header pill more opaque and shadowed once the page scrolls. */
export function HeaderScrollShell({ children }: { children: ReactNode }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      data-scrolled={scrolled}
      className={cn(
        "mx-auto grid h-14 max-w-5xl grid-cols-[1fr_auto] items-center gap-4 rounded-full border lg:grid-cols-[1fr_auto_1fr] bg-background/90 px-4 transition-[background-color,box-shadow] duration-200 motion-reduce:transition-none supports-[backdrop-filter]:bg-background/60 supports-[backdrop-filter]:backdrop-blur-xl",
        scrolled
          ? "shadow-lg supports-[backdrop-filter]:bg-background/80"
          : "shadow-sm"
      )}
    >
      {children}
    </div>
  );
}

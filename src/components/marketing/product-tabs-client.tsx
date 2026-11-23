"use client";

import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type TabItem = { id: string; label: string; icon: ReactNode };

type ProductTabsClientProps = {
  tabs: TabItem[];
  /** Server-rendered panels, same order as `tabs`. All are in the HTML; inactive ones are `hidden`. */
  panels: ReactNode[];
};

export function ProductTabsClient({ tabs, panels }: ProductTabsClientProps) {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  function select(index: number) {
    setActive(index);
    refs.current[index]?.focus();
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const last = tabs.length - 1;
    const next =
      event.key === "ArrowRight" ? (index === last ? 0 : index + 1)
      : event.key === "ArrowLeft" ? (index === 0 ? last : index - 1)
      : event.key === "Home" ? 0
      : event.key === "End" ? last
      : null;
    if (next === null) return;
    event.preventDefault();
    select(next);
  }

  return (
    <div className="flex flex-col gap-10 sm:gap-14">
      <div className="max-w-full self-center overflow-x-auto rounded-full border bg-background p-1.5 shadow-sm">
        <div role="tablist" aria-label="Product features" className="flex w-max gap-1">
          {tabs.map((tab, i) => (
            <button
              key={tab.id}
              ref={(el) => {
                refs.current[i] = el;
              }}
              id={`product-tab-${tab.id}`}
              role="tab"
              type="button"
              aria-selected={active === i}
              aria-controls={`product-panel-${tab.id}`}
              tabIndex={active === i ? 0 : -1}
              onClick={() => setActive(i)}
              onKeyDown={(e) => onKeyDown(e, i)}
              className={cn(
                "inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                active === i ? "bg-foreground text-background [&_svg]:text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      {tabs.map((tab, i) => (
        <div
          key={tab.id}
          id={`product-panel-${tab.id}`}
          role="tabpanel"
          aria-labelledby={`product-tab-${tab.id}`}
          hidden={active !== i}
        >
          {panels[i]}
        </div>
      ))}
    </div>
  );
}

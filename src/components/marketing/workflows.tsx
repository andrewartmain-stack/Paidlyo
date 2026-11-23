import type { ComponentType } from "react";
import {
  InvoiceSpot,
  OrganizeSpot,
  PaySpot,
  ReportSpot,
  TrackSpot,
} from "@/components/marketing/illustrations";
import { WORKFLOWS } from "@/content/showcase";

const SPOTS: Record<string, ComponentType<{ className?: string }>> = {
  track: TrackSpot,
  invoice: InvoiceSpot,
  "get-paid": PaySpot,
  report: ReportSpot,
  organize: OrganizeSpot,
};

export function Workflows() {
  return (
    <section aria-labelledby="workflows-title" className="bg-background py-24 sm:py-28">
      <div className="mx-auto flex max-w-6xl flex-col gap-14 px-4 sm:px-6">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center">
          <h2 id="workflows-title" className="mk-h2">
            {WORKFLOWS.title}
          </h2>
          <p className="mk-lead text-muted-foreground">{WORKFLOWS.description}</p>
        </div>
        <ul className="-mx-4 flex scroll-px-4 sm:scroll-px-6 snap-x snap-mandatory gap-8 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-5 lg:gap-6 lg:overflow-visible lg:px-0 lg:pb-0">
          {WORKFLOWS.items.map((item) => {
            const Spot = SPOTS[item.id];
            return (
              <li key={item.id} className="flex w-64 shrink-0 snap-start flex-col gap-3 lg:w-auto">
                <Spot className="mb-3 size-24" />
                <h3 className="font-heading text-[1.75rem] leading-tight font-medium tracking-tight">{item.title}</h3>
                <p className="font-semibold text-foreground">{item.subtitle}</p>
                <p className="text-sm leading-relaxed text-muted-foreground">{item.description}</p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

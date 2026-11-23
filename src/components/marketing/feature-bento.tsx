import { Check, Copy } from "lucide-react";
import type { ReactNode } from "react";
import { BENTO } from "@/content/showcase";
import { cn } from "@/lib/utils";

const chip = "rounded-full border bg-card px-3 py-1 text-xs font-medium";

function Rates() {
  const rows = [
    ["Maya Chen", "$150/h"],
    ["Leo Park", "$120/h"],
    ["Website redesign", "$135/h"],
  ];
  return (
    <div className="flex w-full max-w-xs flex-col gap-2">
      {rows.map(([name, rate]) => (
        <div key={name} className="flex items-center justify-between rounded-xl bg-card px-4 py-2.5 text-sm">
          <span>{name}</span>
          <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-semibold text-accent-foreground">{rate}</span>
        </div>
      ))}
    </div>
  );
}

function Budget() {
  return (
    <div className="w-full max-w-xs rounded-xl bg-card p-4 text-sm">
      <p className="font-medium">Website redesign</p>
      <p className="text-xs text-muted-foreground">Acme Co. · 43 of 50 h</p>
      <div className="mt-3 h-2 rounded-full bg-muted">
        <div className="h-full w-[86%] rounded-full bg-primary" />
      </div>
      <p className="mt-3 rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground">
        Budget alert: 86% used
      </p>
    </div>
  );
}

function ClientLink() {
  return (
    <div className="flex w-full max-w-xs flex-col gap-2 rounded-xl bg-card p-4 text-sm">
      <p className="font-medium">Invoice #1042 · Northwind</p>
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1 truncate rounded-lg border bg-background px-3 py-2 text-xs text-muted-foreground">
          paidlyo.com/i/k3x9…
        </div>
        <span className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground">
          <Copy className="size-3.5" /> Copy
        </span>
      </div>
    </div>
  );
}

function Currency() {
  const rows = [
    ["Acme Co.", "USD"],
    ["Northwind", "EUR"],
    ["Fabrikam", "GBP"],
  ];
  return (
    <div className="flex w-full max-w-xs flex-col gap-2">
      {rows.map(([name, code]) => (
        <div key={name} className="flex items-center justify-between rounded-xl bg-card px-4 py-2.5 text-sm">
          <span>{name}</span>
          <span className={chip}>{code}</span>
        </div>
      ))}
    </div>
  );
}

function Approvals() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-3 rounded-xl bg-card p-4 text-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium">Maya Chen</p>
          <p className="text-xs text-muted-foreground">Week of Mar 10 · 38.5 h</p>
        </div>
        <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">Submitted</span>
      </div>
      <div className="flex gap-2">
        <span className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground">
          <Check className="size-3.5" /> Approve
        </span>
        <span className="rounded-lg border px-3 py-2 text-xs font-medium">Send back</span>
      </div>
    </div>
  );
}

const SNIPPETS: Record<string, () => ReactNode> = {
  rates: Rates,
  budget: Budget,
  link: ClientLink,
  currency: Currency,
  approvals: Approvals,
};

export function FeatureBento() {
  return (
    <section aria-labelledby="bento-title" className="bg-background py-24 sm:py-28">
      <div className="mx-auto flex max-w-6xl flex-col gap-14 px-4 sm:px-6">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center">
          <h2 id="bento-title" className="mk-h2">
            {BENTO.title}
          </h2>
          <p className="mk-lead text-muted-foreground">{BENTO.description}</p>
        </div>
        <ul className="grid gap-6 lg:grid-cols-6">
          {BENTO.cards.map((card, i) => {
            const Snippet = SNIPPETS[card.id];
            return (
              <li key={card.id} className={cn("flex flex-col gap-5", i < 3 ? "lg:col-span-2" : "lg:col-span-3")}>
                <div
                  aria-hidden="true"
                  className="flex min-h-56 items-center justify-center rounded-2xl bg-cream p-6 sm:p-8"
                >
                  <Snippet />
                </div>
                <div className="flex flex-col gap-2 px-1">
                  <h3 className="font-heading text-[1.375rem] leading-snug font-medium tracking-tight sm:text-2xl">
                    {card.title}
                  </h3>
                  <p className="text-muted-foreground">{card.description}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

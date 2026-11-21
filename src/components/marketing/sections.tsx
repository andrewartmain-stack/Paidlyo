import Link from "next/link";
import { ArrowRight, Banknote, BarChart3, Check, Clock, FileUp, Link2, ReceiptText, type LucideIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FAQ, FEATURES, FINAL_CTA, HERO, STEPS, SWITCH, type FaqItem, type Feature } from "@/content/landing";
import { ProductPreview } from "./product-preview";

/* Landing page sections. Server components; copy lives in src/content/landing.ts. */

function SectionHeading({ id, eyebrow, title, description }: { id: string; eyebrow?: string; title: string; description?: string }) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-3 text-center">
      {eyebrow && <p className="text-sm font-semibold text-brand">{eyebrow}</p>}
      <h2 id={id} className="text-3xl sm:text-4xl">
        {title}
      </h2>
      {description && <p className="text-lg text-muted-foreground">{description}</p>}
    </div>
  );
}

export function Hero() {
  return (
    <section aria-labelledby="hero-title" className="overflow-hidden">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-14 px-4 pt-16 pb-24 sm:px-6 sm:pt-24 sm:pb-32">
        <div className="flex max-w-3xl flex-col items-center gap-6 text-center">
          <p className="rounded-full bg-accent px-3 py-1 text-sm font-medium text-accent-foreground">{HERO.eyebrow}</p>
          <h1 id="hero-title" className="text-4xl leading-tight sm:text-6xl">
            {HERO.title}
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground sm:text-xl">{HERO.description}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href={HERO.primaryCta.href} className={buttonVariants({ size: "lg" })}>
              {HERO.primaryCta.label}
              <ArrowRight aria-hidden />
            </Link>
            <Link href={HERO.secondaryCta.href} className={buttonVariants({ size: "lg", variant: "outline" })}>
              {HERO.secondaryCta.label}
            </Link>
          </div>
        </div>
        <ProductPreview />
      </div>
    </section>
  );
}

const FEATURE_ICONS: Record<Feature["icon"], LucideIcon> = {
  clock: Clock,
  receipt: ReceiptText,
  link: Link2,
  banknote: Banknote,
  chart: BarChart3,
  import: FileUp,
};

export function FeatureGrid() {
  return (
    <section id="features" aria-labelledby="features-title" className="scroll-mt-20 bg-muted/60 py-20 sm:py-28">
      <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 sm:px-6">
        <SectionHeading
          id="features-title"
          eyebrow="Features"
          title="Everything you need to bill your time"
          description="One place for your hours, invoices and payments, without the extra screens."
        />
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => {
            const Icon = FEATURE_ICONS[feature.icon];
            return (
              <li key={feature.title} className="flex flex-col gap-3 rounded-2xl border bg-card p-6">
                <span className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Icon className="size-5" aria-hidden />
                </span>
                <h3 className="text-lg">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{feature.text}</p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

export function Steps() {
  return (
    <section id="how-it-works" aria-labelledby="steps-title" className="scroll-mt-20 py-20 sm:py-28">
      <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 sm:px-6">
        <SectionHeading id="steps-title" eyebrow="How it works" title="From tracked hours to paid invoice" />
        <ol className="grid gap-8 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <li key={step.title} className="flex flex-col gap-3">
              <span className="flex size-10 items-center justify-center rounded-full bg-foreground font-heading font-bold text-background">
                {i + 1}
              </span>
              <h3 className="text-xl">{step.title}</h3>
              <p className="text-muted-foreground">{step.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function SwitchFromHarvest() {
  return (
    <section id="switch-from-harvest" aria-labelledby="switch-title" className="scroll-mt-20 px-4 sm:px-6">
      <div className="mx-auto grid max-w-6xl gap-10 rounded-3xl bg-brand px-6 py-14 text-white sm:px-12 md:grid-cols-2 md:items-center">
        <div className="flex flex-col gap-4">
          <h2 id="switch-title" className="text-3xl text-white sm:text-4xl">
            {SWITCH.title}
          </h2>
          <p className="text-lg text-white/80">{SWITCH.description}</p>
          <div>
            <Link href="/signup" className={buttonVariants({ size: "lg" })}>
              Start your import
              <ArrowRight aria-hidden />
            </Link>
          </div>
        </div>
        <ul className="flex flex-col gap-4">
          {SWITCH.points.map((point) => (
            <li key={point} className="flex gap-3">
              <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Check className="size-4" aria-hidden />
              </span>
              <span className="text-white/90">{point}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function Faq({ items = FAQ, title = "Questions, answered" }: { items?: FaqItem[]; title?: string }) {
  return (
    <section id="faq" aria-labelledby="faq-title" className="scroll-mt-20 py-20 sm:py-28">
      <div className="mx-auto flex max-w-3xl flex-col gap-10 px-4 sm:px-6">
        <SectionHeading id="faq-title" eyebrow="FAQ" title={title} />
        <div className="flex flex-col divide-y rounded-2xl border bg-card">
          {items.map((item) => (
            <details key={item.question} className="group px-6 py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium outline-none focus-visible:underline [&::-webkit-details-marker]:hidden">
                <h3 className="text-base">{item.question}</h3>
                <span
                  aria-hidden
                  className="text-xl leading-none text-muted-foreground transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="mt-3 text-muted-foreground">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FinalCta() {
  return (
    <section aria-labelledby="cta-title" className="px-4 pb-20 sm:px-6 sm:pb-28">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-5 rounded-3xl bg-accent px-6 py-14 text-center">
        <h2 id="cta-title" className="text-3xl sm:text-4xl">
          {FINAL_CTA.title}
        </h2>
        <p className="max-w-xl text-lg text-muted-foreground">{FINAL_CTA.description}</p>
        <Link href={FINAL_CTA.cta.href} className={cn(buttonVariants({ size: "lg" }))}>
          {FINAL_CTA.cta.label}
          <ArrowRight aria-hidden />
        </Link>
      </div>
    </section>
  );
}

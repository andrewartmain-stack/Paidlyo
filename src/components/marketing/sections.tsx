import type { CSSProperties, ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { CARD_ICON_COMPONENTS } from "@/components/marketing/card-icon";
import {
  ArrowRight,
  ArrowUpRight,
  Banknote,
  BarChart3,
  Briefcase,
  Building2,
  Check,
  CircleCheck,
  Clock,
  CreditCard,
  Download,
  FileUp,
  Gauge,
  Globe,
  Laptop,
  Link2,
  Lock,
  Mail,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  Store,
  Timer,
  Users,
  type LucideIcon,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ASK_AI,
  AUDIENCES,
  AUDIENCE_PAGES,
  AUDIENCES_INTRO,
  FAQ,
  FEATURES,
  FINAL_CTA,
  HERO,
  PRICING_SUMMARY,
  STEPS,
  SWITCH,
  TOUR,
  TOUR_INTRO,
  TRUST,
  type Audience,
  type Feature,
  type TourItem,
  type TrustItem,
} from "@/content/landing";
import { livePaths } from "@/content/pages";
import { formatPlanPrice, PLAN } from "@/content/pricing";
import { AiLogo } from "./ai-logos";
import { HeroVideo } from "./hero-video";
import { CheckRow, GoogleButton, HeroSignup } from "./hero-signup";
import { ImportFlow } from "./illustrations";

/* Landing page sections. Server components; copy lives in src/content/landing.ts.
   Motion is CSS only (.mk-* in globals.css): scroll-reveal needs animation-timeline support and
   no reduced-motion preference, otherwise everything is simply visible. */

/** Card hover: lift, brand border. Pair with `group` so icons can tint. */
const CARD_HOVER =
  "group transition duration-300 hover:-translate-y-1 hover:border-brand/40 hover:shadow-[0_18px_40px_-24px_rgb(14_15_12/0.4)]";
/** Icon chip that turns lime on card hover. */
const ICON_CHIP =
  "flex shrink-0 items-center justify-center rounded-xl bg-accent text-brand transition-colors duration-300 group-hover:bg-primary group-hover:text-primary-foreground";

/** Calm card hover for cards on cream or white: a gentle lift, no border change. */
const SOFT_HOVER = "transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-26px_rgb(14_15_12/0.3)]";

/** Scroll-reveal with a subtle stagger by position (0-3). */
function reveal(i = 0): { className: string; style: CSSProperties } {
  return { className: "mk-reveal", style: { "--mk-i": i % 4 } as CSSProperties };
}

const AUDIENCE_ICONS: Record<Audience["icon"], LucideIcon> = {
  agency: Building2,
  consultancy: Briefcase,
  freelancer: Laptop,
  business: Store,
};

const TOUR_ICONS: Record<TourItem["icon"], LucideIcon> = {
  clock: Clock,
  invoice: ReceiptText,
  link: Link2,
  chart: BarChart3,
};

/** Landing steps use their own three icons; content pages may use any card icon. */
const STEP_ICONS = { ...CARD_ICON_COMPONENTS, import: FileUp, timer: Timer, invoice: ReceiptText } satisfies Record<string, LucideIcon>;

export function SectionHeading({ id, eyebrow, title, description }: { id: string; eyebrow?: string; title: string; description?: string }) {
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center">
      {eyebrow && <p className="text-sm font-semibold tracking-wide text-brand">{eyebrow}</p>}
      <h2 id={id} className="mk-h2 text-balance">
        {title}
      </h2>
      {description && <p className="mk-lead max-w-2xl text-muted-foreground">{description}</p>}
    </div>
  );
}

/** Hand-drawn, slightly imperfect green stroke under a phrase. Draws in only when motion is allowed. */
function HandUnderline() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 300 18"
      preserveAspectRatio="none"
      className="pointer-events-none absolute max-sm:hidden -bottom-[0.18em] left-[-2%] h-[0.28em] w-[104%] overflow-visible"
    >
      <path
        className="mk-underline"
        pathLength={1}
        d="M3 11.5C38 6.5 74 5 112 7.2c40 2.3 78-1.6 120-3.4 22-.9 41 .2 65 2.4M20 15.6c52-3.4 108-4.6 168-3.2 30 .7 58 .4 86-1.2"
        fill="none"
        stroke="var(--primary)"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

const HIGHLIGHT = "bill by the hour";

function HeroTitle() {
  const i = HERO.title.indexOf(HIGHLIGHT);
  if (i < 0) return <>{HERO.title}</>;
  return (
    <>
      {HERO.title.slice(0, i)}
      <span className="relative max-sm:box-decoration-clone max-sm:bg-[linear-gradient(transparent_78%,var(--primary)_78%,var(--primary)_94%,transparent_94%)] sm:inline-block sm:whitespace-nowrap">
        {HIGHLIGHT}
        <HandUnderline />
      </span>
      {HERO.title.slice(i + HIGHLIGHT.length)}
    </>
  );
}

export function Hero() {
  return (
    <section aria-labelledby="hero-title" className="-mt-14 bg-cream">
      {/* -mt-14 pulls the cream up behind the floating header; pt adds that height back. */}
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-10 px-4 pt-24 pb-20 sm:px-6 sm:pt-30 sm:pb-28">
        <div className="flex w-full flex-col items-center gap-6 text-center">
          <h1 id="hero-title" className="mk-h1 max-w-4xl text-balance">
            <HeroTitle />
          </h1>
          <p className="mk-lead max-w-[640px] text-muted-foreground">{HERO.description}</p>
          <HeroSignup checks={HERO.checks} />
        </div>
        <div className="w-full max-w-[1100px] rounded-3xl bg-primary/15 bg-[repeating-linear-gradient(135deg,transparent_0_12px,color-mix(in_oklab,var(--primary)_40%,transparent)_12px_14px)] p-3 shadow-[0_30px_70px_-40px_rgb(14_15_12/0.45)] sm:p-6 lg:p-10">
          <HeroVideo label={HERO.videoLabel} />
        </div>
      </div>
    </section>
  );
}

export async function Audiences() {
  const live = await livePaths();
  return (
    <section id="who-its-for" aria-labelledby="audiences-title" className="scroll-mt-20 bg-background py-24 sm:py-28">
      <div className="mx-auto flex max-w-6xl flex-col gap-14 px-4 sm:px-6">
        <SectionHeading id="audiences-title" eyebrow="Who it's for" title={AUDIENCES_INTRO.title} description={AUDIENCES_INTRO.description} />
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {AUDIENCES.map((audience) => {
            const page = AUDIENCE_PAGES[audience.slug];
            const href = live.has(page) ? page : undefined;
            const Icon = AUDIENCE_ICONS[audience.icon];
            return (
              <li key={audience.slug} className={cn("flex flex-col gap-4 rounded-3xl bg-cream p-7", SOFT_HOVER)}>
                <span className={cn(ICON_CHIP, "size-12 bg-white")}>
                  <Icon className="size-6" aria-hidden />
                </span>
                <h3 className="text-xl font-medium">{audience.title}</h3>
                <p className="text-base leading-relaxed text-muted-foreground">{audience.text}</p>
                {href && (
                  <Link href={href} className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline">
                    Paidlyo for {audience.title.toLowerCase()}
                    <ArrowRight className="size-4" aria-hidden />
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

/** A real app screenshot in a light browser frame. */
export function ScreenshotFrame({ src, alt, width, height }: { src: string; alt: string; width: number; height: number }) {
  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-[0_24px_60px_-30px_rgb(14_15_12/0.35)]">
      <div aria-hidden className="flex items-center gap-1.5 border-b bg-muted/60 px-4 py-2.5">
        <span className="size-2.5 rounded-full bg-input" />
        <span className="size-2.5 rounded-full bg-input" />
        <span className="size-2.5 rounded-full bg-input" />
      </div>
      <Image src={src} alt={alt} width={width} height={height} sizes="(min-width: 1024px) 560px, 100vw" className="h-auto w-full" />
    </div>
  );
}

function TourPoints({ points }: { points: string[] }) {
  return (
    <ul className="flex flex-col gap-2">
      {points.map((point) => (
        <li key={point} className="flex gap-2 text-sm">
          <CircleCheck className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
          {point}
        </li>
      ))}
    </ul>
  );
}

function TourText({ item }: { item: TourItem }) {
  const Icon = TOUR_ICONS[item.icon];
  return (
    <div className="flex flex-col gap-4">
      <p className="flex items-center gap-2.5 text-sm font-semibold text-brand">
        <span className={cn(ICON_CHIP, "size-8 rounded-lg")}>
          <Icon className="size-4" aria-hidden />
        </span>
        {item.eyebrow}
      </p>
      <h3 className="text-2xl sm:text-3xl">{item.title}</h3>
      <p className="text-muted-foreground">{item.text}</p>
      <TourPoints points={item.points} />
    </div>
  );
}

/**
 * The core workflows. With screenshots for every item: alternating text/image rows. Until then:
 * a two-column grid of text cards, so the page never shows an empty image slot.
 */
export function ProductTour() {
  const withImages = TOUR.every((item) => item.screenshot);
  return (
    <section id="features" aria-labelledby="tour-title" className="scroll-mt-20 bg-muted/60 py-20 sm:py-28">
      <div className="mx-auto flex max-w-6xl flex-col gap-14 px-4 sm:px-6">
        <SectionHeading id="tour-title" eyebrow="Features" title={TOUR_INTRO.title} description={TOUR_INTRO.description} />
        {withImages ? (
          <div className="flex flex-col gap-20">
            {TOUR.map((item, i) => (
              <article key={item.id} className="mk-reveal grid items-center gap-10 lg:grid-cols-2">
                <div className={cn(i % 2 === 1 && "lg:order-2")}>
                  <TourText item={item} />
                </div>
                {item.screenshot && <ScreenshotFrame {...item.screenshot} />}
              </article>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {TOUR.map((item, i) => {
              const r = reveal(i % 2);
              return (
                <article key={item.id} style={r.style} className={cn("rounded-2xl border bg-card p-6 sm:p-8", r.className, CARD_HOVER)}>
                  <TourText item={item} />
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

const FEATURE_ICONS: Record<Feature["icon"], LucideIcon> = {
  gauge: Gauge,
  check: CircleCheck,
  users: Users,
  banknote: Banknote,
  globe: Globe,
  download: Download,
};

export function FeatureGrid() {
  return (
    <section aria-labelledby="more-features-title" className="py-20 sm:py-28">
      <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 sm:px-6">
        <SectionHeading
          id="more-features-title"
          title="Everything else you need to run billable work"
          description="Budgets, approvals, team rates and payments, included in the same price."
        />
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, i) => {
            const Icon = FEATURE_ICONS[feature.icon];
            const r = reveal(i % 3);
            return (
              <li key={feature.title} style={r.style} className={cn("flex flex-col gap-3 rounded-2xl border bg-card p-6", r.className, CARD_HOVER)}>
                <span className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6">
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

type StepItem = { title: string; text: string; icon?: keyof typeof STEP_ICONS };

export function Steps({
  id = "how-it-works",
  eyebrow = "How it works",
  title = "From tracked hours to paid invoice",
  items = STEPS,
}: {
  id?: string;
  eyebrow?: string;
  title?: string;
  items?: readonly StepItem[];
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-20 bg-cream py-24 sm:py-28">
      <div className="mx-auto flex max-w-6xl flex-col gap-14 px-4 sm:px-6">
        <SectionHeading id={`${id}-title`} eyebrow={eyebrow} title={title} />
        <ol className={cn("grid gap-5", items.length % 3 === 0 ? "md:grid-cols-3" : "md:grid-cols-2 lg:grid-cols-4")}>
          {items.map((step, i) => {
            const Icon = step.icon ? STEP_ICONS[step.icon] : null;
            return (
              <li key={`${i}-${step.title}`} className="flex flex-col gap-4 rounded-3xl bg-white p-7">
                <div className="flex items-center justify-between">
                  <span className="flex size-10 items-center justify-center rounded-full bg-foreground font-heading font-semibold text-background">
                    {i + 1}
                  </span>
                  {Icon && (
                    <span className={cn(ICON_CHIP, "size-12")}>
                      <Icon className="size-6" aria-hidden />
                    </span>
                  )}
                </div>
                <h3 className="mk-h3">{step.title}</h3>
                <p className="text-base leading-relaxed text-muted-foreground">{step.text}</p>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

export function SwitchFromHarvest() {
  return (
    <section id="switch-from-harvest" aria-labelledby="switch-title" className="scroll-mt-20 bg-cream px-4 pb-24 sm:px-6 sm:pb-28">
      <div className="mx-auto grid max-w-6xl gap-12 rounded-3xl bg-brand px-6 py-14 text-white sm:px-12 sm:py-16 md:grid-cols-2 md:items-center">
        <div className="flex flex-col gap-5">
          <ImportFlow className="mx-auto mb-2 h-auto w-full max-w-xs md:mx-0 md:max-w-sm" />
          <h2 id="switch-title" className="mk-h2 text-balance text-white">
            {SWITCH.title}
          </h2>
          <p className="mk-lead text-white/80">{SWITCH.description}</p>
          <div>
            <Link href="/signup" className={buttonVariants({ size: "lg" })}>
              Start your import
              <ArrowRight aria-hidden />
            </Link>
          </div>
        </div>
        <ul className="flex flex-col gap-5">
          {SWITCH.points.map((point) => (
            <li key={point} className="flex gap-3">
              <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Check className="size-4" aria-hidden />
              </span>
              <span className="text-base leading-relaxed text-white/90">{point}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function PricingSummary() {
  return (
    <section id="pricing" aria-labelledby="pricing-summary-title" className="scroll-mt-20 bg-background py-24 sm:py-28">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:items-center">
        <div className="flex flex-col gap-6">
          <p className="text-sm font-semibold tracking-wide text-brand">Pricing</p>
          <h2 id="pricing-summary-title" className="mk-h2 text-balance">
            {PRICING_SUMMARY.title}
          </h2>
          <p className="mk-lead max-w-xl text-muted-foreground">{PRICING_SUMMARY.description}</p>
          <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="rounded-lg bg-primary/45 px-2 font-heading text-5xl font-medium tabular-nums">
              {formatPlanPrice(PLAN.monthlyCents)}
            </span>
            <span className="text-muted-foreground">per person / month, or {formatPlanPrice(PLAN.yearlyCents)} / year</span>
          </p>
          <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">{PRICING_SUMMARY.trial}</p>
          <div className="flex flex-wrap gap-3">
            <Link href="/signup" className={buttonVariants({ size: "lg" })}>
              Start your free trial
              <ArrowRight aria-hidden />
            </Link>
            <Link href="/pricing" className={buttonVariants({ size: "lg", variant: "outline" })}>
              See full pricing
            </Link>
          </div>
        </div>
        <TeamPriceTable sizes={PRICING_SUMMARY.teamSizes} />
      </div>
    </section>
  );
}

/** Paidlyo's monthly price for a few team sizes. */
export function TeamPriceTable({ sizes }: { sizes: readonly number[] }) {
  return (
    <div className="mk-reveal overflow-hidden rounded-2xl border bg-card">
      <table className="w-full text-left">
        <caption className="sr-only">Paidlyo monthly price by team size</caption>
        <thead className="bg-muted/60 text-sm text-muted-foreground">
          <tr>
            <th scope="col" className="px-6 py-3 font-medium">Team size</th>
            <th scope="col" className="px-6 py-3 text-right font-medium">Per month</th>
            <th scope="col" className="px-6 py-3 text-right font-medium">Per year</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {sizes.map((people) => (
            <tr key={people}>
              <th scope="row" className="px-6 py-4 font-medium">
                {people === 1 ? "1 person" : `${people} people`}
              </th>
              <td className="px-6 py-4 text-right tabular-nums">{formatPlanPrice(people * PLAN.monthlyCents)}</td>
              <td className="px-6 py-4 text-right tabular-nums">{formatPlanPrice(people * PLAN.yearlyCents)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const TRUST_ICONS: Record<TrustItem["icon"], LucideIcon> = {
  lock: Lock,
  shield: ShieldCheck,
  card: CreditCard,
  download: Download,
  mail: Mail,
};

export function Trust() {
  return (
    <section id="security" aria-labelledby="trust-title" className="scroll-mt-20 bg-cream py-24 sm:py-28">
      <div className="mx-auto flex max-w-6xl flex-col gap-14 px-4 sm:px-6">
        <SectionHeading id="trust-title" eyebrow="Security and privacy" title={TRUST.title} description={TRUST.description} />
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {TRUST.items.map((item) => {
            const Icon = TRUST_ICONS[item.icon];
            return (
              <li key={item.title} className={cn("flex flex-col gap-4 rounded-3xl bg-white p-7", SOFT_HOVER)}>
                <span className={cn(ICON_CHIP, "size-12")}>
                  <Icon className="size-6" aria-hidden />
                </span>
                <h3 className="text-xl font-medium">{item.title}</h3>
                <p className="text-base leading-relaxed text-muted-foreground">{item.text}</p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

/** Not on the page for now (removed 2026-11-23); add <AskAi /> back to Trust to re-enable. "Don't take our word for it": opens the visitor's AI assistant with a prepared question about Paidlyo. */
export function AskAi() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col items-center gap-5 rounded-3xl bg-cream-deep p-7 text-center sm:p-10">
      <Sparkles className="size-7 text-brand" aria-hidden />
      <h3 className="mk-h3">{ASK_AI.title}</h3>
      <p className="max-w-xl text-base leading-relaxed text-muted-foreground">{ASK_AI.description}</p>
      <ul className="flex flex-wrap justify-center gap-3">
        {ASK_AI.assistants.map((assistant) => (
          <li key={assistant.name}>
            <a
              href={assistant.url}
              target="_blank"
              rel="nofollow noopener noreferrer"
              className="inline-flex h-11 items-center gap-2.5 rounded-full border bg-white pr-5 pl-4 text-sm font-medium transition-colors hover:border-brand/40 hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <AiLogo name={assistant.logo} className="size-5" />
              Ask {assistant.name}
              <ArrowUpRight className="size-4 text-muted-foreground" aria-hidden />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Faq({ items = FAQ, title = "Questions, answered" }: { items?: { question: string; answer: ReactNode }[]; title?: string }) {
  return (
    <section id="faq" aria-labelledby="faq-title" className="scroll-mt-20 bg-background py-24 sm:py-28">
      <div className="mx-auto flex max-w-3xl flex-col gap-12 px-4 sm:px-6">
        <SectionHeading id="faq-title" eyebrow="FAQ" title={title} />
        <div className="flex flex-col gap-3">
          {items.map((item, i) => (
            <details key={`${i}-${item.question}`} className="group rounded-2xl bg-cream px-6 py-5 open:bg-cream-deep">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-md font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
                <h3 className="text-lg font-medium">{item.question}</h3>
                <span
                  aria-hidden
                  className="text-2xl leading-none text-muted-foreground transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FinalCta({
  title = FINAL_CTA.title,
  description = FINAL_CTA.description,
}: {
  title?: string;
  description?: string;
}) {
  return (
    <section aria-labelledby="cta-title" className="bg-background px-4 pb-24 sm:px-6 sm:pb-28">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-5 rounded-[2rem] bg-primary bg-[repeating-linear-gradient(135deg,transparent_0_14px,color-mix(in_oklab,var(--brand)_8%,transparent)_14px_16px)] px-6 py-12 text-center sm:px-12 sm:py-14">
        <h2 id="cta-title" className="mk-h2 max-w-2xl text-balance">
          {title}
        </h2>
        <p className="mk-lead max-w-xl text-foreground/70">{description}</p>
        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
          <Link href={FINAL_CTA.cta.href} className={cn(buttonVariants({ size: "lg" }), "h-12 bg-foreground px-6 text-base text-background hover:bg-foreground/90")}>
            {FINAL_CTA.cta.label}
            <ArrowRight aria-hidden />
          </Link>
          <GoogleButton />
        </div>
        <CheckRow items={HERO.checks} className="text-foreground/70 [&_svg]:text-foreground" />
      </div>
    </section>
  );
}

import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeftRight,
  ArrowRight,
  BookOpen,
  ChartColumn,
  Check,
  ChevronRight,
  Info,
  Layers,
  LayoutGrid,
  Lightbulb,
  Minus,
  Scale,
  Sparkles,
  TriangleAlert,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { JsonLd } from "@/components/marketing/json-ld";
import { CardIcon } from "@/components/marketing/card-icon";
import { InlineText, RichText } from "@/components/marketing/rich-text";
import { ScreenshotFrame, SectionHeading } from "@/components/marketing/sections";
import { AUTHOR } from "@/content/author";
import { HERO } from "@/content/landing";
import { formatPlanPrice, PLAN } from "@/content/pricing";
import { paidlyoMonthlyCents, toolMonthlyCents } from "@/content/pages/pricing-math";
import { pageCards } from "@/content/pages/cards";
import type { CardIconKey } from "@/content/pages/icons";
import type { PageType } from "@/content/pages/paths";
import type { CalloutKind, ComparisonCell, LandingSection, Screenshot, ToolPrice } from "@/content/pages/schema";
import { breadcrumbJsonLd } from "@/content/structured-data";

/* Building blocks shared by the programmatic page templates. Server components only. */

export type Crumb = { name: string; path: string };

/** Visible breadcrumb trail plus its BreadcrumbList JSON-LD. The last crumb is the current page. */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd(items)} />
      <nav aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
          {items.map((item, i) => {
            const last = i === items.length - 1;
            return (
              <li key={item.path} className="flex items-center gap-1">
                {last ? (
                  <span aria-current="page" className="text-foreground">
                    {item.name}
                  </span>
                ) : (
                  <>
                    <Link href={item.path} className="hover:text-foreground">
                      {item.name}
                    </Link>
                    <ChevronRight className="size-3.5" aria-hidden />
                  </>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}

/** Shown on template previews only, so placeholder pages are never mistaken for real ones. */
export function PreviewBanner() {
  return (
    <div role="note" className="border-b border-dashed bg-accent px-4 py-2 text-center text-sm text-accent-foreground">
      Template preview with placeholder content. This page is not indexed or linked anywhere.
    </div>
  );
}

/** Page header with the single h1, breadcrumbs and the trial call to action. */
export function PageHero({
  crumbs,
  eyebrow,
  title,
  description,
  updated,
  showCta = true,
}: {
  crumbs: Crumb[];
  eyebrow?: string;
  title: string;
  description: string;
  /** Shows the author byline with this "Updated" date. */
  updated?: string;
  showCta?: boolean;
}) {
  return (
    <section aria-labelledby="page-title" className="px-4 pt-10 pb-16 sm:px-6 sm:pt-14 sm:pb-20">
      <div className="mx-auto flex max-w-6xl flex-col gap-10">
        <Breadcrumbs items={crumbs} />
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 text-center">
          {eyebrow && (
            <p className="rounded-full bg-accent px-3 py-1 text-sm font-medium text-accent-foreground">{eyebrow}</p>
          )}
          <h1 id="page-title" className="text-4xl leading-tight sm:text-5xl">
            {title}
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground sm:text-xl">{description}</p>
          {updated && <Byline updated={updated} />}
          {showCta && (
            <div className="flex flex-col items-center gap-3">
              <Link href={HERO.primaryCta.href} className={buttonVariants({ size: "lg" })}>
                {HERO.primaryCta.label}
                <ArrowRight aria-hidden />
              </Link>
              <p className="text-sm text-muted-foreground">{HERO.note}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/** A titled grid of cards (problems, reasons, benefits, features). Cards with `href` link out. */
export function CardSection({
  id,
  eyebrow,
  title,
  description,
  items,
  muted = false,
}: {
  id: string;
  eyebrow?: string;
  title: string;
  description?: string;
  items: { title: string; text: string; href?: string; icon?: CardIconKey }[];
  muted?: boolean;
}) {
  return (
    <section aria-labelledby={`${id}-title`} className={muted ? "bg-muted/60 py-20 sm:py-24" : "py-20 sm:py-24"}>
      <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 sm:px-6">
        <SectionHeading id={`${id}-title`} eyebrow={eyebrow} title={title} description={description} />
        <ul className={`grid gap-4 sm:grid-cols-2 ${items.length % 3 === 0 ? "lg:grid-cols-3" : ""}`}>
          {items.map((item, i) => (
            <li key={`${i}-${item.title}`} className="flex flex-col gap-3 rounded-2xl border bg-card p-6">
              {item.icon && <CardIcon icon={item.icon} className="mb-1" />}
              <h3 className="text-lg">{item.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                <InlineText text={item.text} />
              </p>
              {item.href && (
                <Link href={item.href} className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline">
                  Learn more about {item.title.toLowerCase()}
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** A worked billing example: label/value rows with an optional total. */
export function ExampleCard({
  title,
  description,
  rows,
  total,
}: {
  title: string;
  description: string;
  rows: { label: string; value: string }[];
  total?: { label: string; value: string };
}) {
  return (
    <section aria-labelledby="example-title" className="py-20 sm:py-24">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:items-center">
        <div className="flex flex-col gap-4">
          <p className="text-sm font-semibold text-brand">Example</p>
          <h2 id="example-title" className="text-3xl sm:text-4xl">
            {title}
          </h2>
          <p className="text-lg text-muted-foreground">{description}</p>
        </div>
        <dl className="divide-y rounded-2xl border bg-card">
          {rows.map((row, i) => (
            <div key={`${row.label}-${i}`} className="flex items-center justify-between gap-4 px-6 py-4">
              <dt className="text-muted-foreground">{row.label}</dt>
              <dd className="text-right font-medium tabular-nums">{row.value}</dd>
            </div>
          ))}
          {total && (
            <div className="flex items-center justify-between gap-4 bg-muted/60 px-6 py-4">
              <dt className="font-semibold">{total.label}</dt>
              <dd className="text-right text-lg font-semibold tabular-nums">{total.value}</dd>
            </div>
          )}
        </dl>
      </div>
    </section>
  );
}

/** Up to four app screenshots with optional captions. Renders nothing when there are none. */
export function ScreenshotGallery({ title, items }: { title: string; items: Screenshot[] }) {
  if (items.length === 0) return null;
  return (
    <section aria-labelledby="screenshots-title" className="bg-muted/60 py-20 sm:py-24">
      <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 sm:px-6">
        <SectionHeading id="screenshots-title" eyebrow="Screenshots" title={title} />
        <div className={items.length === 1 ? "mx-auto w-full max-w-4xl" : "grid gap-8 lg:grid-cols-2"}>
          {items.map((shot) => (
            <figure key={shot.src} className="flex flex-col gap-3">
              <ScreenshotFrame src={shot.src} alt={shot.alt} width={shot.width} height={shot.height} />
              {shot.caption && <figcaption className="text-center text-sm text-muted-foreground">{shot.caption}</figcaption>}
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

function Cell({ value }: { value: ComparisonCell }) {
  if (value === true) {
    return (
      <>
        <Check className="mx-auto size-5 text-brand" aria-hidden />
        <span className="sr-only">Yes</span>
      </>
    );
  }
  if (value === false) {
    return (
      <>
        <Minus className="mx-auto size-5 text-muted-foreground" aria-hidden />
        <span className="sr-only">No</span>
      </>
    );
  }
  return <span className="text-sm">{value}</span>;
}

/** Feature comparison: one column per tool, Paidlyo last and highlighted. */
export function ComparisonTable({
  title,
  columns,
  rows,
}: {
  title: string;
  columns: string[];
  rows: { feature: string; values: ComparisonCell[] }[];
}) {
  const last = columns.length - 1;
  return (
    <section aria-labelledby="comparison-title" className="py-20 sm:py-24">
      <div className="mx-auto flex max-w-5xl flex-col gap-10 px-4 sm:px-6">
        <SectionHeading id="comparison-title" eyebrow="Comparison" title={title} />
        <div className="overflow-x-auto rounded-2xl border bg-card">
          <table className="w-full min-w-[32rem] text-left">
            <caption className="sr-only">{title}</caption>
            <thead className="bg-muted/60 text-sm">
              <tr>
                <th scope="col" className="px-6 py-3 font-medium text-muted-foreground">
                  Feature
                </th>
                {columns.map((column, i) => (
                  <th key={column} scope="col" className={`px-6 py-3 text-center font-semibold ${i === last ? "text-brand" : ""}`}>
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((row, i) => (
                <tr key={`${i}-${row.feature}`}>
                  <th scope="row" className="px-6 py-4 font-medium">
                    {row.feature}
                  </th>
                  {row.values.map((value, i) => (
                    <td key={i} className={`px-6 py-4 text-center ${i === last ? "bg-accent/40" : ""}`}>
                      <Cell value={value} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

const usd = formatPlanPrice;

/**
 * Monthly cost by team size: each competitor, then Paidlyo. Every competitor price shows its
 * plan, source and the date it was checked, so the numbers can be verified.
 */
export function PriceComparison({ title, tools, sizes }: { title: string; tools: ToolPrice[]; sizes: number[] }) {
  return (
    <section aria-labelledby="price-title" className="bg-muted/60 py-20 sm:py-24">
      <div className="mx-auto flex max-w-5xl flex-col gap-10 px-4 sm:px-6">
        <SectionHeading id="price-title" eyebrow="Pricing" title={title} description="Monthly cost for the whole team." />
        <div className="overflow-x-auto rounded-2xl border bg-card">
          <table className="w-full min-w-[28rem] text-left">
            <caption className="sr-only">{title}</caption>
            <thead className="bg-muted/60 text-sm">
              <tr>
                <th scope="col" className="px-6 py-3 font-medium text-muted-foreground">
                  Team size
                </th>
                {tools.map((tool) => (
                  <th key={tool.name} scope="col" className="px-6 py-3 text-right font-semibold">
                    {tool.name}
                    <span className="block text-xs font-normal text-muted-foreground">{tool.plan}</span>
                  </th>
                ))}
                <th scope="col" className="px-6 py-3 text-right font-semibold text-brand">
                  Paidlyo
                  <span className="block text-xs font-normal text-muted-foreground">Everything included</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {sizes.map((people) => (
                <tr key={people}>
                  <th scope="row" className="px-6 py-4 font-medium">
                    {people === 1 ? "1 person" : `${people} people`}
                  </th>
                  {tools.map((tool) => (
                    <td key={tool.name} className="px-6 py-4 text-right tabular-nums">
                      {usd(toolMonthlyCents(tool, people))}
                    </td>
                  ))}
                  <td className="bg-accent/40 px-6 py-4 text-right font-semibold tabular-nums">{usd(paidlyoMonthlyCents(people))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ul className="flex flex-col gap-1 text-xs text-muted-foreground">
          {tools.map((tool) => (
            <li key={tool.name}>
              {tool.name} {tool.plan}: {usd(tool.perPersonCents)} per person a month
              {tool.billedAnnually && " billed annually"}
              {tool.baseCents > 0 && ` plus ${usd(tool.baseCents)} a month`}
              {tool.minSeats > 1 && `, minimum ${tool.minSeats} people`}. Source:{" "}
              <a href={tool.source} rel="nofollow noopener" target="_blank" className="underline hover:text-foreground">
                {tool.name} pricing
              </a>
              , checked {tool.checkedOn}.
            </li>
          ))}
          <li>Paidlyo: {usd(PLAN.monthlyCents)} per person a month, billed monthly. Taxes may apply.</li>
        </ul>
      </div>
    </section>
  );
}

/** Internal links to related pages, with descriptive anchor text. */
/** Links the author picked, shown as cards with the target page's cover. Links to unpublished pages are left out. */
export async function RelatedLinks({ links }: { links: { href: string; label: string }[] }) {
  const cards = await pageCards();
  const items = links.flatMap((link): LinkCard[] => {
    const target = cards.get(link.href.split(/[?#]/)[0]);
    if (target) return [{ ...target, href: link.href, title: link.label }];
    // Fixed pages (pricing, sign up …) have no cover: they get the branded placeholder.
    return STATIC_LINKS.has(link.href.split(/[?#]/)[0]) ? [{ href: link.href, title: link.label, text: "" }] : [];
  });
  return <LinkGrid id="related" eyebrow="Keep reading" title="Related" links={items} />;
}

/** Text sections, each with an optional image; image rows alternate sides on wide screens. */
const dateFormat = new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeZone: "UTC" });
export const formatDate = (iso: string) => dateFormat.format(new Date(`${iso}T00:00:00Z`));

function Avatar({ size }: { size: number }) {
  return (
    <Image
      src={AUTHOR.avatar.src}
      alt=""
      width={size}
      height={size}
      sizes={`${size}px`}
      className="shrink-0 rounded-full bg-muted object-cover"
      style={{ width: size, height: size }}
    />
  );
}

/** "By Andrei Artemov · Updated 24 November 2026" with the author's photo. `author` overrides the name. */
export function Byline({ updated, author = AUTHOR.name, className }: { updated: string; author?: string; className?: string }) {
  return (
    <p className={`flex items-center gap-2 text-sm text-muted-foreground ${className ?? ""}`}>
      {author === AUTHOR.name && <Avatar size={28} />}
      <span>
        By <span className="font-medium text-foreground">{author}</span> · Updated{" "}
        <time dateTime={updated}>{formatDate(updated)}</time>
      </span>
    </p>
  );
}

/** Who wrote the page, shown at the end of long text (and in the sidebar on desktop). */
export function AuthorBox({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <div className={`flex items-center gap-4 rounded-2xl border bg-card ${compact ? "p-4" : "p-6"} ${className ?? ""}`}>
      <Avatar size={compact ? 44 : 64} />
      <div className="flex flex-col">
        {!compact && <p className="text-xs font-semibold tracking-wide text-brand uppercase">Written by</p>}
        <p className="font-semibold">{AUTHOR.name}</p>
        <p className="text-sm text-muted-foreground">{AUTHOR.role}</p>
      </div>
    </div>
  );
}

/** A highlighted takeaway under a section's text. */
const CALLOUTS: Record<Exclude<CalloutKind, "stat">, { label: string; icon: LucideIcon; box: string; chip: string }> = {
  tip: { label: "Tip", icon: Lightbulb, box: "bg-accent/70", chip: "bg-primary text-primary-foreground" },
  note: { label: "Note", icon: Info, box: "bg-muted", chip: "bg-background text-foreground" },
  warning: { label: "Watch out", icon: TriangleAlert, box: "bg-warning/10", chip: "bg-warning/20 text-warning" },
};

/** A highlighted box under a section: a tip, a note, a warning, or a key number (`stat`, figure in **bold**). */
export function Callout({ text, kind = "tip" }: { text: string; kind?: CalloutKind }) {
  if (kind === "stat") {
    // "**3 h** saved per invoice run": the leading bold part is the figure.
    const figure = text.match(/^\*\*(.+?)\*\*/)?.[1];
    const label = figure ? text.replace(/^\*\*.+?\*\*\s*/, "") : text;
    return (
      <aside className="flex items-center gap-5 rounded-3xl bg-cream px-6 py-5">
        {figure ? (
          <p className="font-heading text-4xl leading-none font-semibold text-brand sm:text-5xl">{figure}</p>
        ) : (
          <ChartColumn className="size-8 shrink-0 text-brand" aria-hidden />
        )}
        <p className="text-base leading-snug text-foreground">
          <InlineText text={label} />
        </p>
      </aside>
    );
  }
  const style = CALLOUTS[kind];
  const Icon = style.icon;
  return (
    <aside className={`flex gap-4 rounded-3xl p-5 ${style.box}`}>
      <span className={`flex size-9 shrink-0 items-center justify-center rounded-full ${style.chip}`}>
        <Icon className="size-4.5" aria-hidden />
      </span>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold">{style.label}</p>
        <p className="text-base leading-relaxed text-foreground">
          <InlineText text={text} />
        </p>
      </div>
    </aside>
  );
}

export type TocItem = { id: string; heading: string };

function TocList({ items }: { items: TocItem[] }) {
  return (
    <ol className="flex flex-col gap-2 text-sm">
      {items.map((item) => (
        <li key={item.id}>
          <a href={`#${item.id}`} className="text-muted-foreground hover:text-brand">
            {item.heading}
          </a>
        </li>
      ))}
    </ol>
  );
}

/** Collapsible "On this page" list above the text (pass "lg:hidden" when a sidebar shows it on desktop). */
export function MobileToc({ items, className }: { items: TocItem[]; className?: string }) {
  return (
    <details className={`rounded-2xl border bg-card p-5 ${className ?? ""}`}>
      <summary className="cursor-pointer font-semibold">On this page</summary>
      <div className="mt-4">
        <TocList items={items} />
      </div>
    </details>
  );
}

/** Sticky desktop sidebar beside long text: contents, author and a trial call to action. */
export function ArticleSidebar({ items }: { items: TocItem[] }) {
  return (
    <aside aria-label="On this page" className="hidden lg:block">
      <div className="sticky top-28 flex flex-col gap-6">
        <nav aria-labelledby="sidebar-toc-title" className="rounded-2xl border bg-card p-5">
          <h2 id="sidebar-toc-title" className="mb-3 text-sm font-semibold">
            On this page
          </h2>
          <TocList items={items} />
        </nav>
        <AuthorBox compact />
        <div className="flex flex-col gap-3 rounded-2xl bg-primary/25 p-5">
          <p className="font-semibold">Try Paidlyo free for 14 days</p>
          <p className="text-sm text-muted-foreground">{formatPlanPrice(PLAN.monthlyCents)} per person a month, every feature included.</p>
          <Link href={HERO.primaryCta.href} className={buttonVariants({ size: "sm", className: "self-start" })}>
            {HERO.primaryCta.label}
            <ArrowRight aria-hidden />
          </Link>
        </div>
      </div>
    </aside>
  );
}

/** Paragraphs, bullets and callout of one text section. */
export type SectionText = { body?: string; paragraphs: string[]; bullets: string[]; callout?: string; calloutKind?: CalloutKind };

/** A section's text: formatted `body`, or the older paragraphs and bullets; then its callout. */
export function SectionBody({ section, muted = true }: { section: SectionText; muted?: boolean }) {
  return (
    <>
      {section.body && <RichText text={section.body} muted={muted} />}
      {section.paragraphs.map((paragraph, j) => (
        <p key={j} className={`text-lg leading-relaxed ${muted ? "text-muted-foreground" : ""}`}>
          <InlineText text={paragraph} />
        </p>
      ))}
      {section.bullets.length > 0 && (
        <ul className="flex flex-col gap-2">
          {section.bullets.map((bullet, j) => (
            <li key={`${j}-${bullet}`} className="flex gap-2 text-lg">
              <Check className="mt-1 size-5 shrink-0 text-brand" aria-hidden />
              <span>
                <InlineText text={bullet} />
              </span>
            </li>
          ))}
        </ul>
      )}
      {section.callout && <Callout text={section.callout} kind={section.calloutKind} />}
    </>
  );
}

/** FAQ items with **bold** and links in the answers (the JSON-LD gets plain text). */
export function richFaq(items: { question: string; answer: string }[]) {
  return items.map((item) => ({ question: item.question, answer: <InlineText text={item.answer} /> }));
}

/** From this many sections on, text is laid out as an article with a sidebar. */
export const LONG_FORM_MIN_SECTIONS = 3;

/** Long text: one reading column with images inline, the sidebar beside it, the author at the end. */
function LongFormSections({ sections }: { sections: LandingSection[] }) {
  const toc = sections.map((section, i) => ({ id: `section-${i + 1}`, heading: section.heading }));
  return (
    <div className="px-4 py-20 sm:px-6 sm:py-24">
      <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="mx-auto flex w-full max-w-3xl min-w-0 flex-col gap-14">
          <MobileToc items={toc} className="lg:hidden" />
          {sections.map((section, i) => (
            <section key={toc[i].id} aria-labelledby={toc[i].id} className="flex scroll-mt-28 flex-col gap-4">
              <h2 id={toc[i].id} className="text-3xl sm:text-4xl">
                {section.heading}
              </h2>
              <SectionBody section={section} />
              {section.image && (
                <figure className="flex flex-col gap-3">
                  <ScreenshotFrame src={section.image.src} alt={section.image.alt} width={section.image.width} height={section.image.height} />
                  {section.image.caption && <figcaption className="text-center text-sm text-muted-foreground">{section.image.caption}</figcaption>}
                </figure>
              )}
            </section>
          ))}
          <AuthorBox className="lg:hidden" />
        </div>
        <ArticleSidebar items={toc} />
      </div>
    </div>
  );
}

/**
 * Text sections of product, variant and audience pages. Up to two: alternating full-width rows
 * with the image beside the text. Three or more: an article column with a sticky sidebar.
 */
export function SectionRows({ sections }: { sections: LandingSection[] }) {
  if (sections.length >= LONG_FORM_MIN_SECTIONS) return <LongFormSections sections={sections} />;
  return (
    <div className="flex flex-col">
      {sections.map((section, i) => {
        const id = `section-${i + 1}`;
        return (
          <section key={id} aria-labelledby={id} className={i % 2 === 1 ? "bg-muted/60 py-20 sm:py-24" : "py-20 sm:py-24"}>
            <div
              className={`mx-auto grid gap-10 px-4 sm:px-6 ${section.image ? "max-w-6xl lg:grid-cols-2 lg:items-center" : "max-w-3xl"}`}
            >
              <div className={`flex flex-col gap-4 ${section.image && i % 2 === 1 ? "lg:order-2" : ""}`}>
                <h2 id={id} className="text-3xl sm:text-4xl">
                  {section.heading}
                </h2>
                <SectionBody section={section} />
              </div>
              {section.image && (
                <figure className="flex flex-col gap-3">
                  <ScreenshotFrame src={section.image.src} alt={section.image.alt} width={section.image.width} height={section.image.height} />
                  {section.image.caption && (
                    <figcaption className="text-center text-sm text-muted-foreground">{section.image.caption}</figcaption>
                  )}
                </figure>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}

/** Links to related pages (a product's variants and audiences, or a page's siblings). Renders nothing when empty. */
export type LinkCard = { href: string; title: string; text: string; type?: PageType; image?: Screenshot };

const STATIC_LINKS = new Set(["/", "/pricing", "/signup", "/login", "/terms", "/privacy"]);

const TYPE_ICONS: Record<PageType, LucideIcon> = {
  product: Layers,
  variant: Sparkles,
  audience: UsersRound,
  feature: LayoutGrid,
  alternative: ArrowLeftRight,
  comparison: Scale,
  guide: BookOpen,
};

/** The linked page's cover, or a branded placeholder with its page-type icon. */
function CardImage({ card }: { card: LinkCard }) {
  if (card.image) {
    return (
      <Image
        src={card.image.src}
        alt=""
        width={card.image.width}
        height={card.image.height}
        sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw"
        className="aspect-[16/10] w-full bg-muted object-cover"
      />
    );
  }
  const Icon = card.type ? TYPE_ICONS[card.type] : ArrowRight;
  return (
    <div aria-hidden className="relative flex aspect-[16/10] w-full items-end overflow-hidden bg-primary/30 p-5">
      <div className="absolute -top-10 -right-10 size-40 rounded-full bg-primary/50" />
      <span className="relative flex size-12 items-center justify-center rounded-2xl bg-background text-brand shadow-sm">
        <Icon className="size-6" />
      </span>
    </div>
  );
}

/** Cards linking to other pages, each with the page's cover on top. Renders nothing when empty. */
export function LinkGrid({
  id,
  eyebrow,
  title,
  links,
  muted = false,
}: {
  id: string;
  eyebrow?: string;
  title: string;
  links: LinkCard[];
  muted?: boolean;
}) {
  if (links.length === 0) return null;
  return (
    <section aria-labelledby={`${id}-title`} className={muted ? "bg-muted/60 py-20 sm:py-24" : "py-20 sm:py-24"}>
      <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 sm:px-6">
        <SectionHeading id={`${id}-title`} eyebrow={eyebrow} title={title} />
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {links.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className="group flex h-full flex-col overflow-hidden rounded-2xl border bg-card transition-colors hover:border-brand">
                <CardImage card={link} />
                <span className="flex flex-1 flex-col gap-2 p-5">
                  <span className="flex items-center justify-between gap-2 text-lg font-medium">
                    {link.title}
                    <ArrowRight className="size-4 shrink-0 text-brand transition-transform group-hover:translate-x-0.5" aria-hidden />
                  </span>
                  {link.text && <span className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">{link.text}</span>}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

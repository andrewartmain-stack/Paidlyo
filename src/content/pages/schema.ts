import { z } from "zod";
import { PRODUCT_SLUGS, RESERVED_VARIANT_SLUGS } from "./paths";

/*
 * Data shapes for the programmatic SEO pages (products, variants, audiences, features,
 * alternatives, comparisons, guides; URL rules in paths.ts). Every collection is parsed with these schemas when the module loads, so a malformed
 * entry fails `next build` instead of shipping a broken page.
 */

const text = z.string().trim().min(1);
const isoDate = z.iso.date();

export const slugSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase words separated by hyphens");

/** Search snippet: title ≤ 60 characters (main keyword first), description ≤ 160. */
const seoSchema = z.object({
  title: text.max(60),
  description: text.max(160),
});

const heroSchema = z.object({
  eyebrow: text.optional(),
  title: text,
  description: text,
});

const faqSchema = z.object({ question: text, answer: text });

const cardSchema = z.object({ title: text, text });

const linkSchema = z.object({
  href: z.string().startsWith("/", "Use an internal path, e.g. /features/timesheets"),
  label: text,
});

/** Images uploaded to Sanity are served from its CDN; local ones live in /public/screenshots. */
export const SANITY_IMAGE_PREFIX = "https://cdn.sanity.io/images/";

/**
 * An image: a real app screenshot in /public/screenshots (exported at 2x, e.g. 1600×1000) or an
 * image uploaded to Sanity.
 */
export const screenshotSchema = z.object({
  src: z.union([
    z.string().regex(/^\/screenshots\/[a-z0-9-]+\.(png|jpg|webp)$/),
    z.url().startsWith(SANITY_IMAGE_PREFIX),
  ]),
  alt: text,
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  caption: text.optional(),
});

/**
 * A competitor's per-person price, with where and when it was checked. Prices change: keep
 * `checkedOn` current and the source a public pricing page.
 */
export const toolPriceSchema = z.object({
  name: text,
  plan: text,
  perPersonCents: z.number().int().nonnegative(),
  /** Flat monthly fee on top of seats, if any. */
  baseCents: z.number().int().nonnegative().default(0),
  /** Minimum number of paid seats, if any. */
  minSeats: z.number().int().positive().default(1),
  /** True when the per-person price assumes annual billing. */
  billedAnnually: z.boolean().default(false),
  source: z.url(),
  checkedOn: isoDate,
});

const productSchema = z.enum(PRODUCT_SLUGS);

/** A block of text with an optional image beside it (product and variant pages). */
const sectionSchema = z.object({
  heading: text,
  paragraphs: z.array(text).min(1),
  bullets: z.array(text).default([]),
  image: screenshotSchema.optional(),
});

/** A card that may link to a feature or other page. */
const linkedCardSchema = z.object({ title: text, text, href: z.string().startsWith("/").optional() });

/** A comparison table cell: yes / no, or a short text such as "Paid add-on". */
const cellSchema = z.union([z.boolean(), text]);

/** Fields every page shares. `preview` marks the template sample: noindex and kept out of the sitemap. */
const pageBase = {
  slug: slugSchema,
  preview: z.boolean().default(false),
  seo: seoSchema,
  /** Target search keywords from the keyword research (not shown; keeps intent explicit). */
  keywords: z.array(text).min(1),
  faq: z.array(faqSchema).default([]),
  related: z.array(linkSchema).default([]),
  updated: isoDate,
};

/** Body shared by product and variant pages. */
const landingFields = {
  hero: heroSchema,
  sections: z.array(sectionSchema).min(1).max(8),
  /** Feature cards, usually linking to /features/… pages. */
  highlights: z.array(linkedCardSchema).max(6).default([]),
  screenshots: z.array(screenshotSchema).max(4).default([]),
  /** Team sizes for the price block, e.g. [1, 5, 15]. */
  teamSizes: z.array(z.number().int().positive()).min(1).max(4),
};

/** /{product}: one page per product, the head term (/invoicing). Its slug is the product. */
export const productPageSchema = z
  .object({ ...pageBase, product: productSchema, ...landingFields })
  .refine((page) => page.slug === page.product, { path: ["slug"], message: "A product page's slug is its product" });

/** /{product}/{variant}: one angle on a product (free, online, app, mac, a country). */
export const variantPageSchema = z
  .object({ ...pageBase, product: productSchema, name: text, ...landingFields })
  .refine((page) => !RESERVED_VARIANT_SLUGS.includes(page.slug), { path: ["slug"], message: '"for" is reserved for audience pages' });

/** /{product}/for/{audience}: one product for one audience (agencies, law firms, …). */
export const audienceSchema = z.object({
  ...pageBase,
  product: productSchema,
  name: text,
  hero: heroSchema,
  painPoints: z.array(cardSchema).min(2).max(6),
  /** A worked example of how this audience bills, e.g. a retainer with its numbers. */
  example: z.object({
    title: text,
    description: text,
    rows: z.array(z.object({ label: text, value: text })).min(2),
    total: z.object({ label: text, value: text }).optional(),
  }),
  /** Optional longer text after the example: headings, paragraphs, bullets, an image. */
  sections: z.array(sectionSchema).max(5).default([]),
  features: z.array(cardSchema.extend({ href: z.string().startsWith("/").optional() })).min(3).max(6),
  /** Team sizes for the price block, e.g. [3, 8, 20]. */
  teamSizes: z.array(z.number().int().positive()).min(1).max(4),
  screenshots: z.array(screenshotSchema).max(4).default([]),
});

/** /alternatives/<slug>: why and how to switch from one competitor. */
export const alternativeSchema = z.object({
  ...pageBase,
  competitor: text,
  hero: heroSchema,
  reasons: z.array(cardSchema).min(2).max(6),
  comparison: z
    .array(z.object({ feature: text, paidlyo: cellSchema, competitor: cellSchema }))
    .min(3),
  pricing: toolPriceSchema,
  teamSizes: z.array(z.number().int().positive()).min(1).max(4),
  migration: z.array(cardSchema).min(2).max(6),
});

/** /compare/<slug>: "X vs Y" or one tool's pricing explained; Paidlyo is always the last column. */
export const comparisonSchema = z
  .object({
    ...pageBase,
    kind: z.enum(["versus", "pricing"]),
    hero: heroSchema,
    tools: z.array(toolPriceSchema).min(1).max(2),
    verdict: z.object({
      summary: text,
      bestFor: z.array(z.object({ tool: text, text })).min(1),
    }),
    /** `values` has one cell per tool, then Paidlyo's. */
    rows: z.array(z.object({ feature: text, values: z.array(cellSchema) })).min(3),
    teamSizes: z.array(z.number().int().positive()).min(1).max(4),
    sections: z.array(z.object({ heading: text, paragraphs: z.array(text).min(1) })).default([]),
  })
  .superRefine((page, ctx) => {
    page.rows.forEach((row, i) => {
      if (row.values.length !== page.tools.length + 1) {
        ctx.addIssue({
          code: "custom",
          path: ["rows", i, "values"],
          message: `Expected ${page.tools.length + 1} values (each tool, then Paidlyo)`,
        });
      }
    });
  });

/** /features/<slug>: one page per capability. */
export const featurePageSchema = z.object({
  ...pageBase,
  name: text,
  /** One line for the /features index card. */
  summary: text,
  hero: heroSchema,
  screenshots: z.array(screenshotSchema).max(4).default([]),
  steps: z.array(cardSchema).min(2).max(6),
  benefits: z.array(cardSchema).min(2).max(6),
});

/** /guides/<slug>: an article answering one question. Plain paragraphs and images, no markup. */
export const guideSchema = z.object({
  ...pageBase,
  title: text,
  description: text,
  author: text,
  published: isoDate,
  /** Shown under the title and used as the article image in search results. */
  cover: screenshotSchema.optional(),
  sections: z
    .array(
      z.object({
        id: slugSchema,
        heading: text,
        paragraphs: z.array(text).min(1),
        bullets: z.array(text).default([]),
        /** Shown after the section's text. */
        image: screenshotSchema.optional(),
      }),
    )
    .min(1),
});

export type ProductPage = z.infer<typeof productPageSchema>;
export type VariantPage = z.infer<typeof variantPageSchema>;
export type AudiencePage = z.infer<typeof audienceSchema>;
export type AlternativePage = z.infer<typeof alternativeSchema>;
export type ComparisonPage = z.infer<typeof comparisonSchema>;
export type FeaturePage = z.infer<typeof featurePageSchema>;
export type GuidePage = z.infer<typeof guideSchema>;
export type ToolPrice = z.infer<typeof toolPriceSchema>;
export type Screenshot = z.infer<typeof screenshotSchema>;
export type ComparisonCell = z.infer<typeof cellSchema>;
export type LandingSection = z.infer<typeof sectionSchema>;
export type LinkedCard = z.infer<typeof linkedCardSchema>;

type Page = { slug: string; preview: boolean; product?: string };

/**
 * Parse a collection at build time: every entry must match the schema, slugs must be unique and
 * at least one entry must exist (Cache Components needs one param per dynamic route; the
 * template preview fills that slot until real pages exist).
 */
export function defineCollection<S extends z.ZodType<Page>>(name: string, schema: S, entries: z.input<S>[]): z.output<S>[] {
  const pages = entries.map((entry, i) => {
    const result = schema.safeParse(entry);
    if (!result.success) {
      throw new Error(`Invalid ${name} entry #${i + 1}: ${z.prettifyError(result.error)}`);
    }
    return result.data;
  });
  if (pages.length === 0) throw new Error(`${name}: add at least one entry (the preview counts)`);
  // Variants and audiences may reuse a slug under different products.
  const slugs = pages.map((page) => (page.product ? `${page.product}/${page.slug}` : page.slug));
  const duplicate = slugs.find((slug, i) => slugs.indexOf(slug) !== i);
  if (duplicate) throw new Error(`${name}: duplicate slug "${duplicate}"`);
  return pages;
}

/** Real pages only: what the sitemap, indexes and internal links may use. */
export function published<T extends Page>(pages: T[]): T[] {
  return pages.filter((page) => !page.preview);
}

/** Find a page by slug (and product, for product, variant and audience pages). */
export function findPage<T extends Page>(pages: T[], slug: string, product?: string): T | undefined {
  return pages.find((page) => page.slug === slug && (product === undefined || page.product === product));
}

/*
 * URL rules for every programmatic page. One rule per page type, defined only here, so links,
 * canonicals, breadcrumbs, the nav and the sitemap always agree:
 *
 *   product      /{product}                      /invoicing
 *   variant      /{product}/{variant}            /invoicing/free, /time-tracking/mac
 *   audience     /{product}/for/{audience}       /invoicing/for/small-business
 *   feature      /features/{feature}             /features/timesheets
 *   alternative  /alternatives/{competitor}      /alternatives/quickbooks
 *   comparison   /compare/{a-vs-b | tool-pricing} /compare/harvest-pricing
 *   guide        /guides/{question}              /guides/what-is-time-tracking-software
 */

/** The three products: the only top-level programmatic URLs. */
export const PRODUCT_SLUGS = ["invoicing", "time-tracking", "time-tracking-and-invoicing"] as const;
export type ProductSlug = (typeof PRODUCT_SLUGS)[number];

export const PRODUCT_NAMES: Record<ProductSlug, string> = {
  invoicing: "Invoicing",
  "time-tracking": "Time tracking",
  "time-tracking-and-invoicing": "Time tracking & invoicing",
};

export function isProduct(value: string): value is ProductSlug {
  return (PRODUCT_SLUGS as readonly string[]).includes(value);
}

export const PAGE_TYPES = ["product", "variant", "audience", "feature", "alternative", "comparison", "guide"] as const;
export type PageType = (typeof PAGE_TYPES)[number];

export const PAGE_PATHS = {
  product: (product: ProductSlug) => `/${product}`,
  variant: (product: ProductSlug, slug: string) => `/${product}/${slug}`,
  audience: (product: ProductSlug, slug: string) => `/${product}/for/${slug}`,
  feature: (slug: string) => `/features/${slug}`,
  alternative: (slug: string) => `/alternatives/${slug}`,
  comparison: (slug: string) => `/compare/${slug}`,
  guide: (slug: string) => `/guides/${slug}`,
} as const;

/** URL of any page. Product, variant and audience pages carry their product. */
export function pagePath(type: PageType, page: { slug: string; product?: ProductSlug }): string {
  if (type === "feature" || type === "alternative" || type === "comparison" || type === "guide") {
    return PAGE_PATHS[type](page.slug);
  }
  if (!page.product) throw new Error(`A ${type} page needs a product`);
  if (type === "product") return PAGE_PATHS.product(page.product);
  return PAGE_PATHS[type](page.product, page.slug);
}

/** A variant can't be called "for": /{product}/for/… holds the audience pages. */
export const RESERVED_VARIANT_SLUGS = ["for"];

/** Slug of the template sample in every collection (noindex, not in the sitemap, never linked). */
export const PREVIEW_SLUG = "preview";

/** Index page listing each page type that has one. Products link to their own sub-pages. */
export const INDEX_PATHS = {
  feature: "/features",
  guide: "/guides",
  alternative: "/alternatives",
  comparison: "/compare",
} as const;

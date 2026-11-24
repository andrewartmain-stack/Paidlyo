/** URL of each page type. Keep in one place so links, canonicals and the sitemap agree. */
export const PAGE_PATHS = {
  audience: (slug: string) => `/for/${slug}`,
  alternative: (slug: string) => `/alternatives/${slug}`,
  comparison: (slug: string) => `/compare/${slug}`,
  feature: (slug: string) => `/features/${slug}`,
  guide: (slug: string) => `/guides/${slug}`,
} as const;

/** Slug of the template sample in every collection (noindex, not in the sitemap, never linked). */
export const PREVIEW_SLUG = "preview";

/** Index page listing each page type (features, guides, alternatives, comparisons). */
export const INDEX_PATHS = {
  feature: "/features",
  guide: "/guides",
  alternative: "/alternatives",
  comparison: "/compare",
} as const;

import { ALTERNATIVE_PAGES } from "./alternatives";
import { AUDIENCE_PAGES } from "./audiences";
import { parseCmsPages, type PageByType } from "./cms";
import { fetchCmsDocs, fetchCmsDocsLive } from "./cms-source";
import { COMPARISON_PAGES } from "./comparisons";
import { FEATURE_PAGES } from "./features";
import { GUIDE_PAGES } from "./guides";
import { INDEX_PATHS, PAGE_TYPES, pagePath, type PageType, type ProductSlug } from "./paths";
import { published } from "./schema";
import { VARIANT_PAGES } from "./variants";

/**
 * Pages kept in code: the template previews. Products have none: a preview would take the real
 * /invoicing URL, so product pages exist only once published in Sanity.
 */
const CODE_PAGES: { [K in PageType]: PageByType[K][] } = {
  product: [],
  variant: VARIANT_PAGES,
  audience: AUDIENCE_PAGES,
  feature: FEATURE_PAGES,
  alternative: ALTERNATIVE_PAGES,
  comparison: COMPARISON_PAGES,
  guide: GUIDE_PAGES,
};

/** `live` reads Sanity on every call instead of the cached copy (sitemap only). */
export type ReadOptions = { live?: boolean };

/** Every page of one type: code pages first, then valid published Sanity documents with a new URL. */
export async function getPages<T extends PageType>(type: T, { live = false }: ReadOptions = {}): Promise<PageByType[T][]> {
  const code: PageByType[T][] = CODE_PAGES[type];
  const docs = live ? await fetchCmsDocsLive(type) : await fetchCmsDocs(type);
  const { pages, errors } = parseCmsPages(type, docs);
  for (const error of errors) console.error(`[cms] Skipped ${type} "${error.slug}": ${error.message}`);
  const codePaths = new Set(code.map((page) => pagePath(type, page)));
  return [...code, ...pages.filter((page) => !codePaths.has(pagePath(type, page)))];
}

/** Published variant and audience pages of one product, for its product page and their siblings. */
export async function productFamily(
  product: ProductSlug,
): Promise<{ variants: PageByType["variant"][]; audiences: PageByType["audience"][] }> {
  const [variants, audiences] = await Promise.all([getPages("variant"), getPages("audience")]);
  return {
    variants: published(variants).filter((page) => page.product === product),
    audiences: published(audiences).filter((page) => page.product === product),
  };
}

type AnyPage = { slug: string; preview: boolean; product?: ProductSlug; updated: string };

/** Every real (non-preview) programmatic page, for the sitemap. */
export async function publishedPages(options: ReadOptions = {}): Promise<{ path: string; updated: string }[]> {
  const all = await Promise.all(
    PAGE_TYPES.map(async (type) => {
      const pages: AnyPage[] = await getPages(type, options);
      return published(pages).map((page) => ({ path: pagePath(type, page), updated: page.updated }));
    }),
  );
  return all.flat();
}

/**
 * URLs that exist right now: every published page, plus each index page that lists at least one.
 * The nav and the landing page link only to these.
 */
export async function livePaths(options: ReadOptions = {}): Promise<Set<string>> {
  const pages = await publishedPages(options);
  const paths = new Set(pages.map((page) => page.path));
  for (const index of Object.values(INDEX_PATHS)) {
    if (pages.some((page) => page.path.startsWith(`${index}/`))) paths.add(index);
  }
  return paths;
}

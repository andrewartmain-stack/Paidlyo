import { ALTERNATIVE_PAGES } from "./alternatives";
import { AUDIENCE_PAGES } from "./audiences";
import { parseCmsPages, type PageByType, type PageType } from "./cms";
import { fetchCmsDocs, fetchCmsDocsLive } from "./cms-source";
import { COMPARISON_PAGES } from "./comparisons";
import { FEATURE_PAGES } from "./features";
import { GUIDE_PAGES } from "./guides";
import { PAGE_PATHS } from "./paths";
import { published } from "./schema";

/** Pages kept in code: the template previews (and any page you prefer to write in TypeScript). */
const CODE_PAGES: { [K in PageType]: PageByType[K][] } = {
  audience: AUDIENCE_PAGES,
  alternative: ALTERNATIVE_PAGES,
  comparison: COMPARISON_PAGES,
  feature: FEATURE_PAGES,
  guide: GUIDE_PAGES,
};

/** `live` reads Sanity on every call instead of the cached copy (sitemap only). */
export type ReadOptions = { live?: boolean };

/** Every page of one type: code pages first, then valid published Sanity documents with a new slug. */
export async function getPages<T extends PageType>(type: T, { live = false }: ReadOptions = {}): Promise<PageByType[T][]> {
  const code: PageByType[T][] = CODE_PAGES[type];
  const docs = live ? await fetchCmsDocsLive(type) : await fetchCmsDocs(type);
  const { pages, errors } = parseCmsPages(type, docs);
  for (const error of errors) console.error(`[cms] Skipped ${type} "${error.slug}": ${error.message}`);
  const codeSlugs = new Set(code.map((page) => page.slug));
  return [...code, ...pages.filter((page) => !codeSlugs.has(page.slug))];
}

/** Every real (non-preview) programmatic page, for the sitemap. */
export async function publishedPages(options: ReadOptions = {}): Promise<{ path: string; updated: string }[]> {
  const [audiences, alternatives, comparisons, features, guides] = await Promise.all([
    getPages("audience", options),
    getPages("alternative", options),
    getPages("comparison", options),
    getPages("feature", options),
    getPages("guide", options),
  ]);
  return [
    ...published(audiences).map((p) => ({ path: PAGE_PATHS.audience(p.slug), updated: p.updated })),
    ...published(alternatives).map((p) => ({ path: PAGE_PATHS.alternative(p.slug), updated: p.updated })),
    ...published(comparisons).map((p) => ({ path: PAGE_PATHS.comparison(p.slug), updated: p.updated })),
    ...published(features).map((p) => ({ path: PAGE_PATHS.feature(p.slug), updated: p.updated })),
    ...published(guides).map((p) => ({ path: PAGE_PATHS.guide(p.slug), updated: p.updated })),
  ];
}

/** Path of each published audience page by slug (landing cards and the nav link only to real pages). */
export async function audiencePaths(): Promise<Map<string, string>> {
  return new Map(published(await getPages("audience")).map((p) => [p.slug, PAGE_PATHS.audience(p.slug)]));
}

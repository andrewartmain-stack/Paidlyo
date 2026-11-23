import { ALTERNATIVE_PAGES } from "./alternatives";
import { AUDIENCE_PAGES } from "./audiences";
import { COMPARISON_PAGES } from "./comparisons";
import { FEATURE_PAGES } from "./features";
import { GUIDE_PAGES } from "./guides";
import { PAGE_PATHS } from "./paths";
import { published } from "./schema";

/** Every real (non-preview) programmatic page, for the sitemap. */
export function publishedPages(): { path: string; updated: string }[] {
  return [
    ...published(AUDIENCE_PAGES).map((p) => ({ path: PAGE_PATHS.audience(p.slug), updated: p.updated })),
    ...published(ALTERNATIVE_PAGES).map((p) => ({ path: PAGE_PATHS.alternative(p.slug), updated: p.updated })),
    ...published(COMPARISON_PAGES).map((p) => ({ path: PAGE_PATHS.comparison(p.slug), updated: p.updated })),
    ...published(FEATURE_PAGES).map((p) => ({ path: PAGE_PATHS.feature(p.slug), updated: p.updated })),
    ...published(GUIDE_PAGES).map((p) => ({ path: PAGE_PATHS.guide(p.slug), updated: p.updated })),
  ];
}

/** Path of a published audience page, or undefined while it doesn't exist (landing cards link only to real pages). */
export function audiencePath(slug: string): string | undefined {
  return published(AUDIENCE_PAGES).some((p) => p.slug === slug) ? PAGE_PATHS.audience(slug) : undefined;
}

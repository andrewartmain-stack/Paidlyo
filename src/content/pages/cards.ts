import { AUTH_PATHS, PUBLIC_PAGES } from "../site-map";
import { getPages, livePaths } from "./index";
import { plainText } from "./markdown";
import { PAGE_TYPES, pagePath, PRODUCT_NAMES, type PageType } from "./paths";
import { published, type Screenshot } from "./schema";

/*
 * What a link to another page shows: its title, a short text and its cover image. Used by the
 * "More about…" grids and Related links, so every card looks the same whichever page it points to.
 */

export type PageCard = { href: string; title: string; text: string; type: PageType; image?: Screenshot };

type AnyPage = {
  slug: string;
  preview: boolean;
  product?: Parameters<typeof pagePath>[1]["product"];
  cover?: Screenshot;
  name?: string;
  title?: string;
  competitor?: string;
  summary?: string;
  description?: string;
  hero?: { title: string; description: string };
};

function card(type: PageType, page: AnyPage): PageCard {
  const title =
    type === "product" && page.product
      ? PRODUCT_NAMES[page.product]
      : type === "audience"
        ? `For ${page.name?.toLowerCase()}`
        : type === "alternative"
          ? `${page.competitor} alternative`
          : (page.name ?? page.title ?? page.hero?.title ?? page.slug);
  const text = page.summary ?? page.description ?? page.hero?.description ?? "";
  return { href: pagePath(type, page), title, text: plainText(text), type, ...(page.cover && { image: page.cover }) };
}

/** Every published page by URL. */
export async function pageCards(): Promise<Map<string, PageCard>> {
  const all = await Promise.all(
    PAGE_TYPES.map(async (type) => {
      const pages: AnyPage[] = await getPages(type);
      return published(pages).map((page) => card(type, page));
    }),
  );
  return new Map(all.flat().map((item) => [item.href, item]));
}

/** Fixed pages that always exist, besides the programmatic ones. */
const STATIC_PATHS = [...PUBLIC_PAGES.map((page) => page.path), ...AUTH_PATHS];

/**
 * Paths a link in page text may point to right now. A link to anything else (a page not
 * published yet) renders as plain text, and becomes a link once that page goes live.
 */
export async function linkablePaths(): Promise<Set<string>> {
  return new Set([...STATIC_PATHS, ...(await livePaths())]);
}

import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { publishedPages } from "@/content/pages";
import { liveIndexes } from "@/content/pages/indexes";
import { PUBLIC_PAGES } from "@/content/site-map";
import { absoluteUrl } from "@/lib/site-url";

/**
 * Static pages, each index page once it has a published page, and every published programmatic
 * page. Rendered per request from live Sanity data: a cached sitemap wasn't refreshed by the
 * webhook on Vercel, and search engines must see new pages right away.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection();
  const [programmatic, indexes] = await Promise.all([publishedPages({ live: true }), liveIndexes({ live: true })]);
  const fixed: MetadataRoute.Sitemap = PUBLIC_PAGES.map((page) => ({
    url: absoluteUrl(page.path),
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));
  const indexPages: MetadataRoute.Sitemap = indexes.map((index) => ({
    url: absoluteUrl(index.path),
    changeFrequency: "weekly",
    priority: 0.7,
  }));
  const pages: MetadataRoute.Sitemap = programmatic.map((page) => ({
    url: absoluteUrl(page.path),
    lastModified: page.updated,
    changeFrequency: "monthly",
    priority: 0.6,
  }));
  return [...fixed, ...indexPages, ...pages];
}

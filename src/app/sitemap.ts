import type { MetadataRoute } from "next";
import { publishedPages } from "@/content/pages";
import { liveIndexes } from "@/content/pages/indexes";
import { PUBLIC_PAGES } from "@/content/site-map";
import { absoluteUrl } from "@/lib/site-url";

/** Static pages, each index page once it has a published page, and every published programmatic page. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [programmatic, indexes] = await Promise.all([publishedPages(), liveIndexes()]);
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

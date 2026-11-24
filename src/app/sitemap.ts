import type { MetadataRoute } from "next";
import { publishedPages } from "@/content/pages";
import { PAGE_PATHS } from "@/content/pages/paths";
import { PUBLIC_PAGES } from "@/content/site-map";
import { absoluteUrl } from "@/lib/site-url";

/** Static pages, the /features index once it has real entries, and every published programmatic page. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const programmatic = await publishedPages();
  const fixed: MetadataRoute.Sitemap = PUBLIC_PAGES.map((page) => ({
    url: absoluteUrl(page.path),
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));
  const featuresIndex: MetadataRoute.Sitemap =
    programmatic.some((page) => page.path.startsWith(PAGE_PATHS.feature(""))) ? [{ url: absoluteUrl("/features"), changeFrequency: "monthly", priority: 0.7 }] : [];
  const pages: MetadataRoute.Sitemap = programmatic.map((page) => ({
    url: absoluteUrl(page.path),
    lastModified: page.updated,
    changeFrequency: "monthly",
    priority: 0.6,
  }));
  return [...fixed, ...featuresIndex, ...pages];
}

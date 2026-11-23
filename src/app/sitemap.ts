import type { MetadataRoute } from "next";
import { publishedPages } from "@/content/pages";
import { FEATURE_PAGES } from "@/content/pages/features";
import { published } from "@/content/pages/schema";
import { PUBLIC_PAGES } from "@/content/site-map";
import { absoluteUrl } from "@/lib/site-url";

/** Static pages, the /features index once it has real entries, and every published programmatic page. */
export default function sitemap(): MetadataRoute.Sitemap {
  const fixed: MetadataRoute.Sitemap = PUBLIC_PAGES.map((page) => ({
    url: absoluteUrl(page.path),
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));
  const featuresIndex: MetadataRoute.Sitemap =
    published(FEATURE_PAGES).length > 0 ? [{ url: absoluteUrl("/features"), changeFrequency: "monthly", priority: 0.7 }] : [];
  const pages: MetadataRoute.Sitemap = publishedPages().map((page) => ({
    url: absoluteUrl(page.path),
    lastModified: page.updated,
    changeFrequency: "monthly",
    priority: 0.6,
  }));
  return [...fixed, ...featuresIndex, ...pages];
}

import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { sanity } from "@/lib/sanity";
import { cmsDocType, cmsTag, pagesQuery, type PageType } from "./cms";

/**
 * Published Sanity documents of one page type. Cached until the Sanity webhook revalidates the
 * tag. If Sanity can't be reached (or the dataset doesn't exist yet) the site renders without CMS
 * pages and retries within minutes instead of failing the build.
 */
export async function fetchCmsDocs(type: PageType): Promise<unknown[]> {
  "use cache";
  cacheTag(cmsTag(type));
  try {
    // Skip Next's fetch cache (untagged, 15 min, kept across builds): this "use cache" scope and
    // the webhook decide freshness, so a publish or a redeploy always reads current content.
    const docs = await sanity.fetch<unknown[]>(pagesQuery(type), { docType: cmsDocType(type) }, { cache: "no-store" });
    cacheLife("max");
    return docs;
  } catch (error) {
    console.error(`[cms] Could not load ${type} pages from Sanity:`, error instanceof Error ? error.message : error);
    cacheLife("minutes");
    return [];
  }
}

/**
 * The same documents read on every call, through Sanity's CDN (Sanity refreshes it on publish).
 * For the sitemap: on Vercel its cached copy wasn't refreshed by the webhook, so it reads live.
 */
export async function fetchCmsDocsLive(type: PageType): Promise<unknown[]> {
  try {
    return await sanity
      .withConfig({ useCdn: true })
      .fetch<unknown[]>(pagesQuery(type), { docType: cmsDocType(type) }, { cache: "no-store" });
  } catch (error) {
    console.error(`[cms] Could not load ${type} pages from Sanity:`, error instanceof Error ? error.message : error);
    return [];
  }
}

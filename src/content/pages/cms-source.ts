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
    const docs = await sanity.fetch<unknown[]>(pagesQuery(type), { docType: cmsDocType(type) });
    cacheLife("max");
    return docs;
  } catch (error) {
    console.error(`[cms] Could not load ${type} pages from Sanity:`, error instanceof Error ? error.message : error);
    cacheLife("minutes");
    return [];
  }
}

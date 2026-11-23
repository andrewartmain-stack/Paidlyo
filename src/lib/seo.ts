import type { Metadata } from "next";
import { SITE } from "@/content/landing";

/**
 * Metadata for a public marketing page. Next merges metadata shallowly, so a page's
 * `openGraph` / `twitter` replace the root layout's: build them in full here.
 */
export function marketingMetadata({
  title,
  description,
  path,
  type = "website",
  noindex = false,
}: {
  title: string;
  description: string;
  path: string;
  /** "article" for guides. */
  type?: "website" | "article";
  /** Template previews and pages without content: kept out of search results. */
  noindex?: boolean;
}): Metadata {
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: path },
    openGraph: { type, siteName: SITE.name, locale: "en_US", title, description, url: path },
    twitter: { card: "summary_large_image", title, description },
    ...(noindex && { robots: { index: false, follow: false } }),
  };
}

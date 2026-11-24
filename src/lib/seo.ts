import type { Metadata } from "next";
import { SITE } from "@/content/landing";

/** The default share image (src/app/og.png/route.tsx). */
export const OG_IMAGE = { url: "/og.png", width: 1200, height: 630, alt: `${SITE.name}: ${SITE.tagline}` };

/** A page-specific share image, e.g. a guide's cover. */
export type ShareImage = { url: string; width: number; height: number; alt: string };

/** A page's cover as its share image (undefined keeps the site image). */
export function coverShareImage(cover?: { src: string; width: number; height: number; alt: string }): ShareImage | undefined {
  return cover && { url: cover.src, width: cover.width, height: cover.height, alt: cover.alt };
}

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
  image = OG_IMAGE,
}: {
  title: string;
  description: string;
  path: string;
  /** "article" for guides. */
  type?: "website" | "article";
  /** Template previews and pages without content: kept out of search results. */
  noindex?: boolean;
  /** Share image; defaults to the site image. */
  image?: ShareImage;
}): Metadata {
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: path },
    openGraph: { type, siteName: SITE.name, locale: "en_US", title, description, url: path, images: [image] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
    // Not indexed, but links are still followed so crawlers reach the pages they point to.
    ...(noindex && { robots: { index: false, follow: true } }),
  };
}

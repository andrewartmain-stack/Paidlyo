import type { MetadataRoute } from "next";
import { PRIVATE_PATHS } from "@/content/site-map";
import { absoluteUrl, siteUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: PRIVATE_PATHS },
    sitemap: absoluteUrl("/sitemap.xml"),
    host: siteUrl(),
  };
}

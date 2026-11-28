import type { NextConfig } from "next";

const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    // 75 = Next's default for photos; 90 for app screenshots, where text must stay sharp.
    qualities: [75, 90],
    remotePatterns: [
      // Organization logos from Supabase Storage (public bucket).
      ...(supabaseHost ? [{ protocol: "https" as const, hostname: supabaseHost, pathname: "/storage/v1/object/public/**" }] : []),
      // Images uploaded to Sanity for the marketing pages (src/content/pages/cms.ts).
      { protocol: "https", hostname: "cdn.sanity.io", pathname: "/images/**" },
    ],
  },
  experimental: {
    serverActions: {
      // Harvest CSV imports are up to 5 MB (logos 1 MB); leave room for multipart overhead.
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;

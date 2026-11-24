/** Public, indexable pages. Add every new marketing page here (sitemap.ts reads this list). */
export const PUBLIC_PAGES: { path: string; changeFrequency: "weekly" | "monthly" | "yearly"; priority: number }[] = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/pricing", changeFrequency: "monthly", priority: 0.8 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.2 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.2 },
];

/** Auth pages: crawlable, noindex in src/app/(auth)/layout.tsx, never in the sitemap. */
export const AUTH_PATHS = ["/login", "/signup", "/forgot-password", "/reset-password"];

/**
 * Private areas: noindex in their layouts and disallowed in robots.txt. Log in / sign up /
 * password pages are NOT listed: they're linked from every page, so they stay crawlable and
 * Google reads their noindex instead of listing the bare URL.
 */
export const PRIVATE_PATHS = [
  "/app/",
  "/i/",
  "/api/",
  "/auth/",
  "/onboarding",
  "/subscribe",
  "/join/",
];

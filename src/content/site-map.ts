/** Public, indexable pages. Add every new marketing page here (sitemap.ts reads this list). */
export const PUBLIC_PAGES: { path: string; changeFrequency: "weekly" | "monthly" | "yearly"; priority: number }[] = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/pricing", changeFrequency: "monthly", priority: 0.8 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.2 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.2 },
];

/** Private areas: noindex in their layouts and disallowed in robots.txt. */
export const PRIVATE_PATHS = [
  "/app/",
  "/i/",
  "/api/",
  "/auth/",
  "/onboarding",
  "/subscribe",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
];

---
name: seo-page
description: Checklist for building any public, indexable marketing page on paidlyo.com (landing sections, features, pricing, blog articles, alternatives, programmatic SEO pages). Use whenever creating or changing a page under src/app/(marketing)/.
---

# Public SEO page

Read the "Public site vs app (SEO)" section of `docs/ARCHITECTURE.md` first.

## Build
1. **Location:** `src/app/(marketing)/<route>/page.tsx`. Content/data in `src/content/`, not
   hard-coded in the page. Reusable sections in `src/components/marketing/`.
2. **Static:** Server Component. No `cookies()`, `headers()`, auth or Supabase user calls.
   Dynamic segments use `generateStaticParams` and `dynamicParams = false` unless new slugs must
   appear without a deploy (then `revalidate`).
3. **Metadata** (`metadata` or `generateMetadata`):
   - title ≤ 60 chars, unique, primary keyword first; description 140–160 chars, unique
   - `alternates.canonical` = the page's own path
   - `openGraph` title/description/url; image from `opengraph-image.tsx` if page-specific
4. **Content structure:** exactly one `<h1>` containing the main keyword; logical `h2`/`h3`;
   semantic tags (`header`, `main`, `article`, `section`, `nav`, `footer`).
5. **Structured data:** a `<script type="application/ld+json">` with the right schema
   (`SoftwareApplication`, `BlogPosting`, `BreadcrumbList`, `FAQPage`). Values must match
   visible content.
6. **Links:** add the page to navigation, footer, an index page or related-content links.
   Descriptive anchor text (never "click here"). Use `next/link`.
7. **Images:** `next/image` with meaningful `alt`, explicit size; `priority` only for the hero.
8. **Performance:** keep client components tiny; no layout shift; no heavy client libraries.
9. **Sitemap:** make sure `src/app/sitemap.ts` includes the URL (with `lastModified` for articles).

## Programmatic pages (extra rules)
- Every page needs unique, genuinely useful content (data, examples, FAQs), not just a swapped keyword.
- Generate from a typed data file; one template component; validate data with Zod at build time.
- Don't publish pages with empty/placeholder data — exclude them from `generateStaticParams`.

## Verify
- `npm run build` shows the route as static (○ or ●), not dynamic (ƒ).
- View page source: title, description, canonical, OG tags and JSON-LD are in the HTML.
- `npm run check` passes.

## Never
- Index anything under `/app`, `/i`, `/api` or auth pages.
- Hide main content behind client-side fetching.

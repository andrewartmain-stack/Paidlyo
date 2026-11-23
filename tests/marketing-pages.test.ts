import { afterEach, describe, expect, it, vi } from "vitest";
import sitemap from "@/app/sitemap";
import { AUDIENCES, TOUR } from "@/content/landing";
import { audiencePath, publishedPages } from "@/content/pages";
import { ALTERNATIVE_PAGES } from "@/content/pages/alternatives";
import { AUDIENCE_PAGES } from "@/content/pages/audiences";
import { COMPARISON_PAGES } from "@/content/pages/comparisons";
import { FEATURE_PAGES } from "@/content/pages/features";
import { GUIDE_PAGES } from "@/content/pages/guides";
import { PAGE_PATHS, PREVIEW_SLUG } from "@/content/pages/paths";
import { paidlyoMonthlyCents, toolMonthlyCents, yearlySavingCents } from "@/content/pages/pricing-math";
import { comparisonSchema, defineCollection, featurePageSchema, findPage, published } from "@/content/pages/schema";
import { breadcrumbJsonLd } from "@/content/structured-data";
import { marketingMetadata } from "@/lib/seo";

afterEach(() => vi.unstubAllEnvs());

const COLLECTIONS = [AUDIENCE_PAGES, ALTERNATIVE_PAGES, COMPARISON_PAGES, FEATURE_PAGES, GUIDE_PAGES];

const FEATURE = {
  slug: "timesheets",
  name: "Timesheets",
  summary: "Weekly timesheets.",
  seo: { title: "Timesheets | Paidlyo", description: "Track your week." },
  keywords: ["timesheet software"],
  hero: { title: "Timesheets", description: "Fill in your week." },
  steps: [
    { title: "Open", text: "Open the week." },
    { title: "Fill", text: "Type hours." },
  ],
  benefits: [
    { title: "Fast", text: "Quick." },
    { title: "Clear", text: "Simple." },
  ],
  updated: "2026-11-23",
};

describe("page collections", () => {
  it("ships exactly one template preview per collection, with defaults applied", () => {
    for (const pages of COLLECTIONS) {
      expect(pages.length).toBeGreaterThanOrEqual(1);
      const preview = findPage<{ slug: string; preview: boolean }>(pages, PREVIEW_SLUG);
      expect(preview?.preview).toBe(true);
    }
  });

  it("keeps previews out of the published list, the sitemap and landing links", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://paidlyo.com");
    for (const pages of COLLECTIONS) {
      expect(published<{ slug: string; preview: boolean }>(pages).some((p) => p.slug === PREVIEW_SLUG)).toBe(false);
    }
    expect(publishedPages().some((p) => p.path.endsWith(`/${PREVIEW_SLUG}`))).toBe(false);
    expect(sitemap().some((entry) => entry.url.endsWith(`/${PREVIEW_SLUG}`))).toBe(false);
    expect(audiencePath(PREVIEW_SLUG)).toBeUndefined();
  });

  it("parses valid entries and applies defaults", () => {
    const [page] = defineCollection("feature", featurePageSchema, [FEATURE]);
    expect(page.preview).toBe(false);
    expect(page.faq).toEqual([]);
    expect(page.screenshots).toEqual([]);
  });

  it("rejects bad slugs, long titles, duplicates and empty collections", () => {
    expect(() => defineCollection("feature", featurePageSchema, [{ ...FEATURE, slug: "Time Sheets" }])).toThrow(/feature entry #1/);
    expect(() =>
      defineCollection("feature", featurePageSchema, [{ ...FEATURE, seo: { ...FEATURE.seo, title: "x".repeat(61) } }]),
    ).toThrow();
    expect(() => defineCollection("feature", featurePageSchema, [FEATURE, FEATURE])).toThrow(/duplicate slug "timesheets"/);
    expect(() => defineCollection("feature", featurePageSchema, [])).toThrow(/at least one entry/);
  });

  it("only accepts screenshots from /screenshots", () => {
    const shot = { alt: "Timesheet", width: 1600, height: 1000 };
    expect(() =>
      defineCollection("feature", featurePageSchema, [{ ...FEATURE, screenshots: [{ ...shot, src: "/screenshots/timesheet.png" }] }]),
    ).not.toThrow();
    expect(() =>
      defineCollection("feature", featurePageSchema, [{ ...FEATURE, screenshots: [{ ...shot, src: "https://x.com/a.png" }] }]),
    ).toThrow();
  });

  it("requires one comparison value per tool plus Paidlyo", () => {
    const [preview] = COMPARISON_PAGES;
    const bad = { ...preview, slug: "a-vs-b", preview: false, rows: [...preview.rows.slice(0, 2), { feature: "X", values: [true] }] };
    const result = comparisonSchema.safeParse(bad);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(["rows", 2, "values"]);
  });
});

describe("pricing math", () => {
  const tool = { perPersonCents: 1200, baseCents: 0, minSeats: 1 };

  it("prices Paidlyo per person", () => {
    expect(paidlyoMonthlyCents(1)).toBe(900);
    expect(paidlyoMonthlyCents(5)).toBe(4500);
  });

  it("applies a competitor's minimum seats and base fee", () => {
    expect(toolMonthlyCents(tool, 5)).toBe(6000);
    expect(toolMonthlyCents({ perPersonCents: 1000, baseCents: 2500, minSeats: 3 }, 1)).toBe(5500);
  });

  it("returns the yearly saving, negative when Paidlyo costs more", () => {
    expect(yearlySavingCents(tool, 5)).toBe((6000 - 4500) * 12);
    expect(yearlySavingCents({ perPersonCents: 500, baseCents: 0, minSeats: 1 }, 2)).toBe(-9600);
  });
});

describe("page SEO helpers", () => {
  it("builds paths for every page type", () => {
    expect(PAGE_PATHS.audience("agencies")).toBe("/for/agencies");
    expect(PAGE_PATHS.alternative("harvest")).toBe("/alternatives/harvest");
    expect(PAGE_PATHS.comparison("harvest-pricing")).toBe("/compare/harvest-pricing");
    expect(PAGE_PATHS.feature("timesheets")).toBe("/features/timesheets");
    expect(PAGE_PATHS.guide("what-is-time-tracking")).toBe("/guides/what-is-time-tracking");
  });

  it("marks previews noindex and guides as articles", () => {
    expect(marketingMetadata({ title: "T", description: "D", path: "/for/preview", noindex: true }).robots).toEqual({
      index: false,
      follow: false,
    });
    expect(marketingMetadata({ title: "T", description: "D", path: "/" }).robots).toBeUndefined();
    expect(marketingMetadata({ title: "T", description: "D", path: "/guides/x", type: "article" }).openGraph).toMatchObject({
      type: "article",
    });
  });

  it("numbers breadcrumb items with absolute URLs", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://paidlyo.com");
    const data = breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Agencies", path: "/for/agencies" },
    ]);
    expect(data.itemListElement[1]).toEqual({ "@type": "ListItem", position: 2, name: "Agencies", item: "https://paidlyo.com/for/agencies" });
  });
});

describe("landing sections", () => {
  it("has unique tour ids and audience slugs", () => {
    expect(new Set(TOUR.map((t) => t.id)).size).toBe(TOUR.length);
    expect(new Set(AUDIENCES.map((a) => a.slug)).size).toBe(AUDIENCES.length);
  });
});

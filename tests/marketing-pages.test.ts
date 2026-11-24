import { afterEach, describe, expect, it, vi } from "vitest";
import sitemap from "@/app/sitemap";
import { AUDIENCES, TOUR } from "@/content/landing";
import { getPages, livePaths, publishedPages } from "@/content/pages";
import { ALTERNATIVE_PAGES } from "@/content/pages/alternatives";
import { AUDIENCE_PAGES } from "@/content/pages/audiences";
import { COMPARISON_PAGES } from "@/content/pages/comparisons";
import { FEATURE_PAGES } from "@/content/pages/features";
import { GUIDE_PAGES } from "@/content/pages/guides";
import { VARIANT_PAGES } from "@/content/pages/variants";
import { PAGE_PATHS, pagePath, PREVIEW_SLUG } from "@/content/pages/paths";
import { paidlyoMonthlyCents, toolMonthlyCents, yearlySavingCents } from "@/content/pages/pricing-math";
import {
  audienceSchema,
  comparisonSchema,
  defineCollection,
  featurePageSchema,
  findPage,
  guideSchema,
  productPageSchema,
  published,
  variantPageSchema,
} from "@/content/pages/schema";
import { cmsDocType, fromCms, pageTypeFromDocType, pagesQuery, parseCmsPages, stripNulls } from "@/content/pages/cms";
import { fetchCmsDocs } from "@/content/pages/cms-source";
import { articleJsonLd, breadcrumbJsonLd } from "@/content/structured-data";
import { AUTHOR } from "@/content/author";
import { CARD_ICONS } from "@/content/pages/icons";
import { indexItems, liveIndexes } from "@/content/pages/indexes";
import { marketingMetadata, OG_IMAGE } from "@/lib/seo";

// Sanity documents per test; the real module uses a Next cache scope and the network.
// Cached and live reads return the same documents here.
vi.mock("@/content/pages/cms-source", () => {
  const fetchCmsDocs = vi.fn(async () => []);
  return { fetchCmsDocs, fetchCmsDocsLive: fetchCmsDocs };
});
vi.mock("next/server", () => ({ connection: async () => {} }));

afterEach(() => {
  vi.unstubAllEnvs();
  vi.mocked(fetchCmsDocs).mockReset();
  vi.mocked(fetchCmsDocs).mockResolvedValue([]);
});

const COLLECTIONS = [VARIANT_PAGES, AUDIENCE_PAGES, ALTERNATIVE_PAGES, COMPARISON_PAGES, FEATURE_PAGES, GUIDE_PAGES];

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

  it("keeps previews out of the published list, the sitemap and landing links", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://paidlyo.com");
    for (const pages of COLLECTIONS) {
      expect(published<{ slug: string; preview: boolean }>(pages).some((p) => p.slug === PREVIEW_SLUG)).toBe(false);
    }
    expect((await publishedPages()).some((p) => p.path.endsWith(`/${PREVIEW_SLUG}`))).toBe(false);
    expect((await sitemap()).some((entry) => entry.url.endsWith(`/${PREVIEW_SLUG}`))).toBe(false);
    expect([...(await livePaths())].some((path) => path.endsWith(`/${PREVIEW_SLUG}`))).toBe(false);
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

/** A guide as the GROQ projection returns it: nulls for empty fields, Sanity keys, images resolved. */
const CMS_GUIDE = {
  _id: "guidePage-track-time",
  _type: "guidePage",
  _rev: "abc",
  slug: "track-time",
  title: "How to track billable hours",
  description: "Start a timer per task, then invoice the week.",
  author: "Paidlyo team",
  published: "2026-11-20",
  updated: "2026-11-23",
  seo: { title: "How to Track Billable Hours | Paidlyo", description: "A short guide." },
  keywords: ["track billable hours"],
  cover: { src: "https://cdn.sanity.io/images/f1ipt922/production/abc-1600x1000.png", width: 1600, height: 1000, alt: "Timer", caption: null },
  sections: [
    { _key: "a", id: "start", heading: "Start a timer", paragraphs: ["Pick a project."], bullets: null, image: null },
  ],
  faq: null,
  related: null,
};

describe("Sanity pages", () => {
  it("maps document types both ways", () => {
    expect(cmsDocType("guide")).toBe("guidePage");
    expect(pageTypeFromDocType("guidePage")).toBe("guide");
    expect(pageTypeFromDocType("sanity.imageAsset")).toBeUndefined();
    expect(pagesQuery("guide")).toContain("cover{");
  });

  it("drops nulls from objects and arrays", () => {
    expect(stripNulls({ a: null, b: [1, null, { c: null, d: 2 }] })).toEqual({ b: [1, { d: 2 }] });
  });

  it("parses a projected document into a page with defaults", () => {
    const { pages, errors } = parseCmsPages("guide", [CMS_GUIDE]);
    expect(errors).toEqual([]);
    expect(pages[0]).toMatchObject({ slug: "track-time", preview: false, faq: [], related: [] });
    expect(pages[0].cover).toEqual({ src: CMS_GUIDE.cover.src, width: 1600, height: 1000, alt: "Timer" });
    expect(pages[0].sections[0]).toEqual({ id: "start", heading: "Start a timer", paragraphs: ["Pick a project."], bullets: [] });
  });

  it("turns yes / no comparison cells into checks", () => {
    const page = fromCms("alternative", { comparison: [{ feature: "Invoices", paidlyo: "Yes", competitor: "Paid add-on" }] });
    expect(page).toMatchObject({ comparison: [{ paidlyo: true, competitor: "Paid add-on" }] });
    expect(fromCms("comparison", { rows: [{ feature: "Timer", values: ["no", "yes", "Beta"] }] })).toMatchObject({
      rows: [{ values: [false, true, "Beta"] }],
    });
  });

  it("skips invalid, duplicate and reserved slugs with a reason", () => {
    const { pages, errors } = parseCmsPages("guide", [
      CMS_GUIDE,
      CMS_GUIDE,
      { ...CMS_GUIDE, slug: PREVIEW_SLUG },
      { ...CMS_GUIDE, slug: "bad-image", cover: { ...CMS_GUIDE.cover, src: "https://evil.example/a.png" } },
    ]);
    expect(pages).toHaveLength(1);
    expect(errors.map((e) => e.slug)).toEqual(["track-time", PREVIEW_SLUG, "bad-image"]);
    expect(errors[2].message).toMatch(/cover\.src/);
  });

  it("lists index pages only once they have a published page", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://paidlyo.com");
    expect(await liveIndexes()).toEqual([]);
    expect(await indexItems("guide")).toEqual([]);
    vi.mocked(fetchCmsDocs).mockImplementation(async (type) => (type === "guide" ? [CMS_GUIDE] : []));
    expect(await liveIndexes()).toEqual([{ type: "guide", path: "/guides", label: "Guides" }]);
    expect(await indexItems("guide")).toEqual([
      { href: "/guides/track-time", title: CMS_GUIDE.title, text: CMS_GUIDE.description, linkLabel: "Read the guide" },
    ]);
    const urls = (await sitemap()).map((entry) => entry.url);
    expect(urls).toContain("https://paidlyo.com/guides");
    expect(urls).not.toContain("https://paidlyo.com/compare");
  });

  it("merges Sanity pages after the code previews and publishes them", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://paidlyo.com");
    vi.mocked(fetchCmsDocs).mockImplementation(async (type) => (type === "guide" ? [CMS_GUIDE] : []));
    const guides = await getPages("guide");
    expect(guides.map((g) => g.slug)).toEqual([PREVIEW_SLUG, "track-time"]);
    expect(await publishedPages()).toEqual([{ path: "/guides/track-time", updated: "2026-11-23" }]);
    expect((await sitemap()).some((entry) => entry.url === "https://paidlyo.com/guides/track-time")).toBe(true);
  });
});

/** A product page as the GROQ projection returns it (slug = product). */
const LANDING = {
  seo: { title: "Invoicing Software | Paidlyo", description: "Invoices from tracked time." },
  keywords: ["invoicing software"],
  hero: { title: "Invoicing software", description: "Bill every hour." },
  sections: [{ heading: "Invoices from time", paragraphs: ["Pick a client."], bullets: null, image: null }],
  highlights: null,
  screenshots: null,
  teamSizes: [1, 5],
  faq: null,
  related: null,
  updated: "2026-11-24",
};

describe("product structure", () => {
  it("validates product, variant and audience pages against their URL rules", () => {
    const ok = (schema: typeof productPageSchema | typeof variantPageSchema, type: "product" | "variant", doc: object) =>
      schema.safeParse(fromCms(type, doc)).success;
    expect(ok(productPageSchema, "product", { ...LANDING, slug: "invoicing", product: "invoicing" })).toBe(true);
    expect(ok(productPageSchema, "product", { ...LANDING, slug: "billing", product: "invoicing" })).toBe(false);
    expect(ok(productPageSchema, "product", { ...LANDING, slug: "payroll", product: "payroll" })).toBe(false);
    const variant = { ...LANDING, product: "invoicing", name: "Free" };
    expect(ok(variantPageSchema, "variant", { ...variant, slug: "free" })).toBe(true);
    expect(ok(variantPageSchema, "variant", { ...variant, slug: "for" })).toBe(false);
    const [preview] = AUDIENCE_PAGES;
    expect(audienceSchema.safeParse({ ...preview, product: undefined }).success).toBe(false);
  });

  it("gives audience pages optional text sections (up to 5)", () => {
    const [preview] = AUDIENCE_PAGES;
    const section = { heading: "How to choose", paragraphs: ["First.", "Second."], bullets: ["A point"] };
    expect(audienceSchema.parse({ ...preview, sections: undefined }).sections).toEqual([]);
    expect(audienceSchema.parse({ ...preview, sections: [section] }).sections[0]).toMatchObject(section);
    expect(audienceSchema.safeParse({ ...preview, sections: Array(6).fill(section) }).success).toBe(false);
  });

  it("allows the same slug under two products but not twice under one", () => {
    const [preview] = AUDIENCE_PAGES;
    const doc = (product: string) => ({ ...preview, preview: undefined, slug: "agencies", product });
    const { pages, errors } = parseCmsPages("audience", [doc("invoicing"), doc("time-tracking"), doc("invoicing")]);
    expect(pages.map((page) => pagePath("audience", page))).toEqual(["/invoicing/for/agencies", "/time-tracking/for/agencies"]);
    expect(errors).toEqual([{ slug: "agencies", message: "another document already uses /invoicing/for/agencies" }]);
    expect(findPage(pages, "agencies", "time-tracking")?.product).toBe("time-tracking");
  });

  it("publishes product pages at the top level and lists live paths for the nav", async () => {
    vi.mocked(fetchCmsDocs).mockImplementation(async (type) =>
      type === "product" ? [{ ...LANDING, _id: "productPage-invoicing", product: "invoicing", slug: "invoicing" }] : [],
    );
    expect((await getPages("product")).map((page) => page.slug)).toEqual(["invoicing"]);
    expect(await publishedPages()).toEqual([{ path: "/invoicing", updated: "2026-11-24" }]);
    expect((await livePaths()).has("/invoicing")).toBe(true);
    expect(pagesQuery("product")).toContain("defined(product)");
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
    expect(PAGE_PATHS.product("invoicing")).toBe("/invoicing");
    expect(PAGE_PATHS.variant("invoicing", "free")).toBe("/invoicing/free");
    expect(PAGE_PATHS.audience("time-tracking", "agencies")).toBe("/time-tracking/for/agencies");
    expect(pagePath("audience", { slug: "agencies", product: "time-tracking" })).toBe("/time-tracking/for/agencies");
    expect(pagePath("guide", { slug: "x" })).toBe("/guides/x");
    expect(() => pagePath("variant", { slug: "free" })).toThrow(/needs a product/);
    expect(PAGE_PATHS.alternative("harvest")).toBe("/alternatives/harvest");
    expect(PAGE_PATHS.comparison("harvest-pricing")).toBe("/compare/harvest-pricing");
    expect(PAGE_PATHS.feature("timesheets")).toBe("/features/timesheets");
    expect(PAGE_PATHS.guide("what-is-time-tracking")).toBe("/guides/what-is-time-tracking");
  });

  it("marks previews noindex (links still followed) and guides as articles", () => {
    expect(marketingMetadata({ title: "T", description: "D", path: "/for/preview", noindex: true }).robots).toEqual({
      index: false,
      follow: true,
    });
    expect(marketingMetadata({ title: "T", description: "D", path: "/" }).robots).toBeUndefined();
    expect(marketingMetadata({ title: "T", description: "D", path: "/guides/x", type: "article" }).openGraph).toMatchObject({
      type: "article",
    });
  });

  it("gives every page a share image, or its own", () => {
    const meta = marketingMetadata({ title: "T", description: "D", path: "/pricing" });
    expect(meta.openGraph?.images).toEqual([OG_IMAGE]);
    expect(meta.twitter?.images).toEqual([OG_IMAGE]);
    const cover = { url: "https://cdn.sanity.io/images/x/production/a-1600x900.png", width: 1600, height: 900, alt: "Cover" };
    expect(marketingMetadata({ title: "T", description: "D", path: "/guides/x", image: cover }).openGraph?.images).toEqual([cover]);
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

describe("readability fields and author", () => {
  const [audience] = AUDIENCE_PAGES;
  const [guide] = GUIDE_PAGES;

  it("accepts card icons from the fixed list only", () => {
    const icon = (value: string) =>
      audienceSchema.safeParse({ ...audience, painPoints: audience.painPoints.map((card) => ({ ...card, icon: value })) }).success;
    expect(CARD_ICONS.every((value) => icon(value))).toBe(true);
    expect(icon("rocket-ship")).toBe(false);
  });

  it("keeps a section callout and defaults guide authors to the site author", () => {
    const section = { heading: "H", paragraphs: ["P"], callout: "Key takeaway." };
    expect(audienceSchema.parse({ ...audience, sections: [section] }).sections[0].callout).toBe("Key takeaway.");
    expect(guideSchema.parse({ ...guide, author: undefined }).author).toBe(AUTHOR.name);
  });

  it("names the author with photo and role in Article JSON-LD", () => {
    const data = articleJsonLd({
      title: "T", description: "D", path: "/guides/t", author: AUTHOR.name, published: "2026-01-01", updated: "2026-01-02",
      authorImage: AUTHOR.avatar.src, authorRole: AUTHOR.role,
    });
    expect(data.author).toMatchObject({ "@type": "Person", name: "Andrei Artemov", jobTitle: "Founder of Paidlyo" });
    expect(data.author.image).toMatch(/\/authors\/andrei-artemov\.jpg$/);
  });
});

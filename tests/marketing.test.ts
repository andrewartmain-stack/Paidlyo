import { afterEach, describe, expect, it, vi } from "vitest";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { FAQ, FEATURES, NAV_LINKS, SITE } from "@/content/landing";
import { PRIVATE_PATHS } from "@/content/site-map";
import { PRIVACY, TERMS } from "@/content/legal";
import { formatPlanPrice, PLAN, PRICING_FAQ, PRICING_META, yearlyMonthsFree } from "@/content/pricing";
import { faqJsonLd, organizationJsonLd, softwareApplicationJsonLd } from "@/content/structured-data";
import { marketingMetadata } from "@/lib/seo";
import { absoluteUrl, siteUrl } from "@/lib/site-url";

afterEach(() => vi.unstubAllEnvs());

describe("site URL", () => {
  it("uses NEXT_PUBLIC_APP_URL without a trailing slash", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://paidlyo.com/");
    expect(siteUrl()).toBe("https://paidlyo.com");
    expect(absoluteUrl("/")).toBe("https://paidlyo.com/");
    expect(absoluteUrl("pricing")).toBe("https://paidlyo.com/pricing");
  });
});

describe("sitemap and robots", () => {
  it("lists public pages with absolute URLs", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://paidlyo.com");
    expect(sitemap().map((entry) => entry.url)).toEqual([
      "https://paidlyo.com/",
      "https://paidlyo.com/pricing",
      "https://paidlyo.com/terms",
      "https://paidlyo.com/privacy",
    ]);
  });

  it("blocks every private area and points to the sitemap", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://paidlyo.com");
    const result = robots();
    expect(result.sitemap).toBe("https://paidlyo.com/sitemap.xml");
    const rules = Array.isArray(result.rules) ? result.rules[0] : result.rules;
    expect(rules.allow).toBe("/");
    for (const path of ["/app/", "/i/", "/api/", "/auth/", "/onboarding", "/login", "/signup"]) {
      expect(rules.disallow).toContain(path);
    }
  });

  it("never lists a private path in the sitemap", () => {
    for (const entry of sitemap()) {
      const path = new URL(entry.url).pathname;
      expect(PRIVATE_PATHS.some((p) => path.startsWith(p))).toBe(false);
    }
  });
});

describe("landing content", () => {
  it("keeps the meta description within 140–160 characters", () => {
    expect(SITE.description.length).toBeGreaterThanOrEqual(140);
    expect(SITE.description.length).toBeLessThanOrEqual(160);
  });

  it("links header items to landing sections that exist", () => {
    const sections = ["features", "how-it-works", "switch-from-harvest", "faq"];
    const anchors = NAV_LINKS.filter((link) => link.href.startsWith("/#"));
    expect(anchors.map((link) => link.href.replace("/#", ""))).toEqual(sections);
    expect(NAV_LINKS.some((link) => link.href === "/pricing")).toBe(true);
  });

  it("has unique feature titles and FAQ questions", () => {
    expect(new Set(FEATURES.map((f) => f.title)).size).toBe(FEATURES.length);
    expect(new Set(FAQ.map((f) => f.question)).size).toBe(FAQ.length);
  });

  it("builds FAQPage JSON-LD from the visible FAQ", () => {
    const data = faqJsonLd();
    expect(data["@type"]).toBe("FAQPage");
    expect(data.mainEntity).toHaveLength(FAQ.length);
    expect(data.mainEntity[0]).toEqual({
      "@type": "Question",
      name: FAQ[0].question,
      acceptedAnswer: { "@type": "Answer", text: FAQ[0].answer },
    });
    expect(organizationJsonLd().name).toBe(SITE.name);
  });
});

describe("marketingMetadata", () => {
  it("keeps site name, card type and canonical on every page", () => {
    const meta = marketingMetadata({ title: "T", description: "D", path: "/pricing" });
    expect(meta.alternates?.canonical).toBe("/pricing");
    expect(meta.openGraph).toMatchObject({ siteName: "Paidlyo", type: "website", url: "/pricing", title: "T" });
    expect(meta.twitter).toMatchObject({ card: "summary_large_image", title: "T" });
  });
});

describe("pricing and legal pages", () => {
  it("formats plan prices and the yearly saving", () => {
    expect(formatPlanPrice(PLAN.monthlyCents)).toBe("$9");
    expect(formatPlanPrice(PLAN.yearlyCents)).toBe("$90");
    expect(formatPlanPrice(1250)).toBe("$12.50");
    expect(yearlyMonthsFree()).toBe(2);
  });

  it("keeps every page's title ≤ 60 and description within 140–160 characters", () => {
    const pages = [
      { title: PRICING_META.title, description: PRICING_META.description },
      { title: TERMS.metaTitle, description: TERMS.metaDescription },
      { title: PRIVACY.metaTitle, description: PRIVACY.metaDescription },
    ];
    for (const page of pages) {
      expect(page.title.length).toBeLessThanOrEqual(60);
      expect(page.description.length).toBeGreaterThanOrEqual(140);
      expect(page.description.length).toBeLessThanOrEqual(160);
    }
  });

  it("puts the visible prices in the SoftwareApplication offers", () => {
    const offers = softwareApplicationJsonLd().offers;
    expect(offers.map((offer) => offer.price)).toEqual(["9.00", "90.00"]);
    expect(new Set(PRICING_FAQ.map((f) => f.question)).size).toBe(PRICING_FAQ.length);
  });
});

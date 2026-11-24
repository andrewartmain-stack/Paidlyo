import { PREVIEW_SLUG } from "./paths";
import { defineCollection, variantPageSchema } from "./schema";

/*
 * Product variant pages (/{product}/<slug>: free, online, app, mac, a country). Written in
 * Sanity; the preview entry shows the template at /invoicing/preview and is never indexed.
 */
export const VARIANT_PAGES = defineCollection("variant", variantPageSchema, [
  {
    slug: PREVIEW_SLUG,
    preview: true,
    product: "invoicing",
    name: "[Variant]",
    seo: { title: "[Free Invoicing Software] | Paidlyo", description: "[140–160 character description with the main keyword first.]" },
    keywords: ["[primary keyword]"],
    hero: { eyebrow: "[Invoicing]", title: "[Variant headline with the keyword]", description: "[Who it is for and what they get.]" },
    sections: [
      { heading: "[Section heading]", paragraphs: ["[Paragraph.]", "[Paragraph.]"], bullets: ["[Point]", "[Point]"] },
      { heading: "[Section heading]", paragraphs: ["[Paragraph.]"] },
    ],
    highlights: [
      { title: "[Feature 1]", text: "[Why it matters here.]", href: "/features/preview" },
      { title: "[Feature 2]", text: "[Why it matters here.]" },
      { title: "[Feature 3]", text: "[Why it matters here.]" },
    ],
    teamSizes: [1, 5, 15],
    faq: [{ question: "[Question]", answer: "[Answer.]" }],
    related: [{ href: "/pricing", label: "Pricing" }],
    updated: "2026-11-24",
  },
]);

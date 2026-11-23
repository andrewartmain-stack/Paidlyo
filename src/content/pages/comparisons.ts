import { PREVIEW_SLUG } from "./paths";
import { comparisonSchema, defineCollection } from "./schema";

/*
 * Comparison pages (/compare/<slug>): kind "versus" for "X vs Y", kind "pricing" for one tool's
 * pricing explained. Paidlyo is added as the last column automatically; each row's `values`
 * lists one cell per tool, then Paidlyo's.
 */
export const COMPARISON_PAGES = defineCollection("comparison", comparisonSchema, [
  {
    slug: PREVIEW_SLUG,
    preview: true,
    kind: "versus",
    seo: { title: "[Tool A] vs [Tool B] | Paidlyo", description: "[140–160 character description with the main keyword first.]" },
    keywords: ["[tool a] vs [tool b]"],
    hero: {
      eyebrow: "Comparison",
      title: "[Tool A] vs [Tool B]",
      description: "[What this comparison covers and who it helps.]",
    },
    tools: [
      { name: "[Tool A]", plan: "[Plan]", perPersonCents: 1000, source: "https://example.com/a", checkedOn: "2026-11-23" },
      { name: "[Tool B]", plan: "[Plan]", perPersonCents: 1200, source: "https://example.com/b", checkedOn: "2026-11-23" },
    ],
    verdict: {
      summary: "[One-paragraph honest verdict.]",
      bestFor: [
        { tool: "[Tool A]", text: "[Who it suits.]" },
        { tool: "[Tool B]", text: "[Who it suits.]" },
        { tool: "Paidlyo", text: "[Who it suits.]" },
      ],
    },
    rows: [
      { feature: "[Feature 1]", values: [true, true, true] },
      { feature: "[Feature 2]", values: [true, false, true] },
      { feature: "[Feature 3]", values: ["[Paid add-on]", true, true] },
    ],
    teamSizes: [1, 5, 15],
    sections: [{ heading: "[Section heading]", paragraphs: ["[Paragraph.]"] }],
    faq: [{ question: "[Question]", answer: "[Answer.]" }],
    related: [{ href: "/pricing", label: "Pricing" }],
    updated: "2026-11-23",
  },
]);

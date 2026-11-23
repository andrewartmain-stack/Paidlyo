import { PREVIEW_SLUG } from "./paths";
import { alternativeSchema, defineCollection } from "./schema";

/*
 * Alternative pages (/alternatives/<slug>). Competitor prices and features must be accurate:
 * take them from the competitor's public pricing page and update `checkedOn` when you re-check.
 */
export const ALTERNATIVE_PAGES = defineCollection("alternative", alternativeSchema, [
  {
    slug: PREVIEW_SLUG,
    preview: true,
    competitor: "[Competitor]",
    seo: { title: "[Competitor] Alternative | Paidlyo", description: "[140–160 character description with the main keyword first.]" },
    keywords: ["[competitor] alternative"],
    hero: {
      eyebrow: "[Competitor] alternative",
      title: "[The simpler, cheaper Competitor alternative]",
      description: "[Who switches and what they get.]",
    },
    reasons: [
      { title: "[Reason to switch 1]", text: "[Specific and verifiable.]" },
      { title: "[Reason to switch 2]", text: "[Specific and verifiable.]" },
      { title: "[Reason to switch 3]", text: "[Specific and verifiable.]" },
    ],
    comparison: [
      { feature: "[Feature 1]", paidlyo: true, competitor: true },
      { feature: "[Feature 2]", paidlyo: true, competitor: "[Paid add-on]" },
      { feature: "[Feature 3]", paidlyo: true, competitor: false },
    ],
    pricing: {
      name: "[Competitor]",
      plan: "[Plan name]",
      perPersonCents: 1000,
      source: "https://example.com/pricing",
      checkedOn: "2026-11-23",
    },
    teamSizes: [1, 5, 15],
    migration: [
      { title: "[Export from Competitor]", text: "[Exact menu path.]" },
      { title: "[Import into Paidlyo]", text: "[What gets created.]" },
      { title: "[Send your first invoice]", text: "[What to check.]" },
    ],
    faq: [{ question: "[Question]", answer: "[Answer.]" }],
    related: [{ href: "/pricing", label: "Pricing" }],
    updated: "2026-11-23",
  },
]);

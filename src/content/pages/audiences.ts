import { PREVIEW_SLUG } from "./paths";
import { audienceSchema, defineCollection } from "./schema";

/*
 * Audience pages (/{product}/for/<slug>). Add one object per audience; the preview entry shows the template
 * with placeholder text and is never indexed. Write unique content for each audience: their
 * workflow, a real billing example and their own FAQs (see the AI prompts in the keyword sheet).
 */
export const AUDIENCE_PAGES = defineCollection("audience", audienceSchema, [
  {
    slug: PREVIEW_SLUG,
    preview: true,
    product: "invoicing",
    name: "[Audience]",
    seo: { title: "[Time Tracking for Audience] | Paidlyo", description: "[140–160 character description with the main keyword first.]" },
    keywords: ["[primary keyword]", "[secondary keyword]"],
    hero: {
      eyebrow: "[For audience]",
      title: "[Time tracking and invoicing for audience]",
      description: "[One or two sentences: the outcome this audience gets, in their words.]",
    },
    painPoints: [
      { title: "[Problem one]", text: "[How it shows up in their week and how Paidlyo removes it.]" },
      { title: "[Problem two]", text: "[How it shows up in their week and how Paidlyo removes it.]" },
      { title: "[Problem three]", text: "[How it shows up in their week and how Paidlyo removes it.]" },
    ],
    example: {
      title: "[How a typical audience bills a client]",
      description: "[A realistic project and billing method, with the numbers worked out.]",
      rows: [
        { label: "[Line 1]", value: "[Value]" },
        { label: "[Line 2]", value: "[Value]" },
        { label: "[Line 3]", value: "[Value]" },
      ],
      total: { label: "[Invoice total]", value: "[Value]" },
    },
    features: [
      { title: "[Feature 1]", text: "[Why it matters to this audience.]" },
      { title: "[Feature 2]", text: "[Why it matters to this audience.]" },
      { title: "[Feature 3]", text: "[Why it matters to this audience.]" },
    ],
    teamSizes: [1, 5, 15],
    faq: [
      { question: "[Question this audience asks 1]", answer: "[Direct answer.]" },
      { question: "[Question this audience asks 2]", answer: "[Direct answer.]" },
      { question: "[Question this audience asks 3]", answer: "[Direct answer.]" },
    ],
    related: [{ href: "/pricing", label: "Pricing" }],
    updated: "2026-11-23",
  },
]);

import { PREVIEW_SLUG } from "./paths";
import { defineCollection, featurePageSchema } from "./schema";

/* Feature pages (/features/<slug>) and the /features index. Only describe what the app does today. */
export const FEATURE_PAGES = defineCollection("feature", featurePageSchema, [
  {
    slug: PREVIEW_SLUG,
    preview: true,
    name: "[Feature]",
    summary: "[One line for the features index.]",
    seo: { title: "[Feature Keyword] | Paidlyo", description: "[140–160 character description with the main keyword first.]" },
    keywords: ["[feature keyword]"],
    hero: { eyebrow: "Feature", title: "[Feature headline]", description: "[What it does and why it matters.]" },
    steps: [
      { title: "[Step 1]", text: "[What the user does.]" },
      { title: "[Step 2]", text: "[What the user does.]" },
      { title: "[Step 3]", text: "[What the user does.]" },
    ],
    benefits: [
      { title: "[Benefit 1]", text: "[Concrete outcome.]" },
      { title: "[Benefit 2]", text: "[Concrete outcome.]" },
    ],
    faq: [{ question: "[Question]", answer: "[Answer.]" }],
    related: [{ href: "/pricing", label: "Pricing" }],
    updated: "2026-11-23",
  },
]);

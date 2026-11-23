import { PREVIEW_SLUG } from "./paths";
import { defineCollection, guideSchema } from "./schema";

/* Guides (/guides/<slug>): one question per article, linking into product pages. */
export const GUIDE_PAGES = defineCollection("guide", guideSchema, [
  {
    slug: PREVIEW_SLUG,
    preview: true,
    title: "[Guide title with the question or keyword]",
    description: "[Lead paragraph: the short answer first.]",
    author: "[Author]",
    published: "2026-11-23",
    seo: { title: "[Guide Title] | Paidlyo", description: "[140–160 character description with the main keyword first.]" },
    keywords: ["[question keyword]"],
    sections: [
      { id: "first-section", heading: "[Section heading]", paragraphs: ["[Paragraph.]", "[Paragraph.]"] },
      { id: "second-section", heading: "[Section heading]", paragraphs: ["[Paragraph.]"], bullets: ["[Point]", "[Point]"] },
    ],
    faq: [{ question: "[Question]", answer: "[Answer.]" }],
    related: [{ href: "/pricing", label: "Pricing" }],
    updated: "2026-11-23",
  },
]);

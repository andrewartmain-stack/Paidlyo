import { defineArrayMember, defineField, defineType } from "sanity";
import { cards, cell, hero, image, pageEnd, pageStart, screenshots, teamSizes, text, toolPrice } from "./fields";

/*
 * One document type per page type. `<type>Page` names must match cmsDocType() in
 * src/content/pages/cms.ts; field names match src/content/pages/schema.ts.
 */

const audiencePage = defineType({
  name: "audiencePage",
  title: "Audience page (/for/…)",
  type: "document",
  fields: [
    text("name", "Audience", { description: "e.g. Agencies" }),
    ...pageStart("name"),
    hero,
    cards("painPoints", "Pain points", 2, 6),
    defineField({
      name: "example",
      title: "Billing example",
      type: "object",
      validation: (rule) => rule.required(),
      fields: [
        text("title", "Title"),
        text("description", "Description", { rows: 3 }),
        defineField({
          name: "rows",
          title: "Rows",
          type: "array",
          of: [defineArrayMember({ type: "object", name: "row", fields: [text("label", "Label"), text("value", "Value")] })],
          validation: (rule) => rule.required().min(2),
        }),
        defineField({ name: "total", title: "Total", type: "object", fields: [text("label", "Label"), text("value", "Value")] }),
      ],
    }),
    cards("features", "Features", 3, 6, [text("href", "Link (optional)", { optional: true, description: "e.g. /features/timesheets" })]),
    teamSizes,
    screenshots,
    ...pageEnd,
  ],
  preview: { select: { title: "name", subtitle: "slug.current" } },
});

const alternativePage = defineType({
  name: "alternativePage",
  title: "Alternative page (/alternatives/…)",
  type: "document",
  fields: [
    text("competitor", "Competitor", { description: "e.g. Harvest" }),
    ...pageStart("competitor"),
    hero,
    cards("reasons", "Reasons to switch", 2, 6),
    defineField({
      name: "comparison",
      title: "Feature comparison",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          name: "comparisonRow",
          fields: [text("feature", "Feature"), cell("paidlyo", "Paidlyo"), cell("competitor", "Competitor")],
          preview: { select: { title: "feature" } },
        }),
      ],
      validation: (rule) => rule.required().min(3),
    }),
    toolPrice("pricing", "Competitor pricing"),
    teamSizes,
    cards("migration", "Migration steps", 2, 6),
    ...pageEnd,
  ],
  preview: { select: { title: "competitor", subtitle: "slug.current" } },
});

const comparisonPage = defineType({
  name: "comparisonPage",
  title: "Comparison page (/compare/…)",
  type: "document",
  fields: [
    ...pageStart("hero.title"),
    defineField({
      name: "kind",
      title: "Kind",
      type: "string",
      options: { list: [{ title: "X vs Y", value: "versus" }, { title: "Pricing explained", value: "pricing" }], layout: "radio" },
      validation: (rule) => rule.required(),
    }),
    hero,
    defineField({
      name: "tools",
      title: "Tools (Paidlyo is added automatically)",
      type: "array",
      of: [defineArrayMember({ ...toolPrice("tool", "Tool"), name: "tool" })],
      validation: (rule) => rule.required().min(1).max(2),
    }),
    defineField({
      name: "verdict",
      title: "Verdict",
      type: "object",
      validation: (rule) => rule.required(),
      fields: [
        text("summary", "Summary", { rows: 4 }),
        defineField({
          name: "bestFor",
          title: "Best for",
          type: "array",
          of: [defineArrayMember({ type: "object", name: "bestFor", fields: [text("tool", "Tool"), text("text", "Who it suits", { rows: 2 })] })],
          validation: (rule) => rule.required().min(1),
        }),
      ],
    }),
    defineField({
      name: "rows",
      title: "Feature rows",
      description: "Values: one per tool, then Paidlyo's (“yes”, “no” or short text).",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          name: "featureRow",
          fields: [
            text("feature", "Feature"),
            defineField({ name: "values", title: "Values", type: "array", of: [{ type: "string" }], validation: (rule) => rule.required().min(2) }),
          ],
          preview: { select: { title: "feature" } },
        }),
      ],
      validation: (rule) => rule.required().min(3),
    }),
    teamSizes,
    defineField({
      name: "sections",
      title: "Sections",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          name: "textSection",
          fields: [
            text("heading", "Heading"),
            defineField({ name: "paragraphs", title: "Paragraphs", type: "array", of: [{ type: "text", rows: 4 }], validation: (rule) => rule.required().min(1) }),
          ],
          preview: { select: { title: "heading" } },
        }),
      ],
    }),
    ...pageEnd,
  ],
  preview: { select: { title: "hero.title", subtitle: "slug.current" } },
});

const featurePage = defineType({
  name: "featurePage",
  title: "Feature page (/features/…)",
  type: "document",
  fields: [
    text("name", "Feature", { description: "e.g. Timesheets" }),
    ...pageStart("name"),
    text("summary", "Summary for the features index", { rows: 2 }),
    hero,
    screenshots,
    cards("steps", "How it works", 2, 6),
    cards("benefits", "Benefits", 2, 6),
    ...pageEnd,
  ],
  preview: { select: { title: "name", subtitle: "slug.current" } },
});

const guidePage = defineType({
  name: "guidePage",
  title: "Guide (/guides/…)",
  type: "document",
  fields: [
    text("title", "Title"),
    ...pageStart("title"),
    text("description", "Lead (short answer first)", { rows: 3 }),
    text("author", "Author"),
    defineField({ name: "published", title: "Published", type: "date", description: "Leave empty to use the creation date." }),
    image("cover", "Cover image"),
    defineField({
      name: "sections",
      title: "Sections",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          name: "guideSection",
          fields: [
            defineField({
              name: "id",
              title: "Anchor",
              type: "string",
              description: "Lowercase words with hyphens, e.g. start-a-timer",
              validation: (rule) => rule.required().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { name: "anchor" }),
            }),
            text("heading", "Heading"),
            defineField({ name: "paragraphs", title: "Paragraphs", type: "array", of: [{ type: "text", rows: 4 }], validation: (rule) => rule.required().min(1) }),
            defineField({ name: "bullets", title: "Bullets", type: "array", of: [{ type: "string" }] }),
            image("image", "Image"),
          ],
          preview: { select: { title: "heading", media: "image" } },
        }),
      ],
      validation: (rule) => rule.required().min(1),
    }),
    ...pageEnd,
  ],
  preview: { select: { title: "title", subtitle: "slug.current", media: "cover" } },
});

export const schemaTypes = [audiencePage, alternativePage, comparisonPage, featurePage, guidePage];

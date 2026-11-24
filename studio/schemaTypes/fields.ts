import { defineArrayMember, defineField } from "sanity";

/*
 * Shared fields. Names and limits mirror src/content/pages/schema.ts (the site validates every
 * document with it and skips pages that don't match), so keep both in sync.
 */


export const text = (name: string, title: string, options: { rows?: number; optional?: boolean; max?: number; description?: string } = {}) =>
  defineField({
    name,
    title,
    type: options.rows ? "text" : "string",
    ...(options.rows ? { rows: options.rows } : {}),
    description: options.description,
    validation: (rule) => {
      let r = options.optional ? rule : rule.required();
      if (options.max) r = r.max(options.max);
      return r;
    },
  });

export const seo = defineField({
  name: "seo",
  title: "Search result",
  type: "object",
  validation: (rule) => rule.required(),
  fields: [
    text("title", "Title", { max: 60, description: "≤ 60 characters, main keyword first, e.g. “Time Tracking for Agencies | Paidlyo”." }),
    text("description", "Description", { rows: 3, max: 160, description: "140–160 characters." }),
  ],
});

export const hero = defineField({
  name: "hero",
  title: "Hero",
  type: "object",
  validation: (rule) => rule.required(),
  fields: [text("eyebrow", "Eyebrow", { optional: true }), text("title", "Title"), text("description", "Description", { rows: 3 })],
});

const card = defineArrayMember({
  type: "object",
  name: "card",
  fields: [text("title", "Title"), text("text", "Text", { rows: 3 })],
  preview: { select: { title: "title", subtitle: "text" } },
});

export const cards = (name: string, title: string, min: number, max: number, extra: ReturnType<typeof defineField>[] = []) =>
  defineField({
    name,
    title,
    type: "array",
    of: extra.length ? [{ ...card, fields: [...card.fields, ...extra] }] : [card],
    validation: (rule) => rule.required().min(min).max(max),
  });

/** An image with required alt text (served from Sanity's CDN). */
export const image = (name: string, title: string, options: { required?: boolean } = {}) =>
  defineField({
    name,
    title,
    type: "image",
    fields: [text("alt", "Alt text", { description: "What the image shows, for screen readers and search." }), text("caption", "Caption", { optional: true })],
    validation: options.required ? (rule) => rule.required() : undefined,
  });

export const screenshots = defineField({
  name: "screenshots",
  title: "Screenshots",
  type: "array",
  of: [defineArrayMember({ ...image("screenshot", "Screenshot") })],
  validation: (rule) => rule.max(4),
});

/** Comparison cell: "yes", "no" or a short text such as "Paid add-on". */
export const cell = (name: string, title: string) =>
  text(name, title, { description: "“yes”, “no” or short text, e.g. “Paid add-on”." });

export const teamSizes = defineField({
  name: "teamSizes",
  title: "Team sizes for the price block",
  type: "array",
  of: [{ type: "number" }],
  description: "e.g. 1, 5, 15",
  validation: (rule) => rule.required().min(1).max(4),
});

export const toolPrice = (name: string, title: string) =>
  defineField({
    name,
    title,
    type: "object",
    validation: (rule) => rule.required(),
    fields: [
      text("name", "Tool"),
      text("plan", "Plan"),
      defineField({ name: "perPersonCents", title: "Price per person (cents / month)", type: "number", validation: (rule) => rule.required().integer().min(0) }),
      defineField({ name: "baseCents", title: "Flat monthly fee (cents)", type: "number", validation: (rule) => rule.integer().min(0) }),
      defineField({ name: "minSeats", title: "Minimum seats", type: "number", validation: (rule) => rule.integer().min(1) }),
      defineField({ name: "billedAnnually", title: "Price assumes annual billing", type: "boolean" }),
      defineField({ name: "source", title: "Pricing page URL", type: "url", validation: (rule) => rule.required() }),
      defineField({ name: "checkedOn", title: "Checked on", type: "date", validation: (rule) => rule.required() }),
    ],
    preview: { select: { title: "name", subtitle: "plan" } },
  });

/** Fields every page has: slug first, then search and links; dates are optional (Sanity's are used). */
export const pageStart = (source: string) => [
  defineField({ name: "slug", title: "Slug (URL)", type: "slug", options: { source }, validation: (rule) => rule.required() }),
  seo,
  defineField({
    name: "keywords",
    title: "Target keywords",
    type: "array",
    of: [{ type: "string" }],
    options: { layout: "tags" },
    description: "From the keyword research; not shown on the page.",
    validation: (rule) => rule.required().min(1),
  }),
];

export const pageEnd = [
  defineField({
    name: "faq",
    title: "FAQ",
    type: "array",
    of: [
      defineArrayMember({
        type: "object",
        name: "faqItem",
        fields: [text("question", "Question"), text("answer", "Answer", { rows: 4 })],
        preview: { select: { title: "question" } },
      }),
    ],
  }),
  defineField({
    name: "related",
    title: "Related links",
    type: "array",
    of: [
      defineArrayMember({
        type: "object",
        name: "link",
        fields: [
          defineField({
            name: "href",
            title: "Path",
            type: "string",
            description: "Internal path, e.g. /features/timesheets",
            validation: (rule) => rule.required().regex(/^\//, { name: "internal path" }),
          }),
          text("label", "Label"),
        ],
        preview: { select: { title: "label", subtitle: "href" } },
      }),
    ],
  }),
  defineField({ name: "updated", title: "Last updated", type: "date", description: "Leave empty to use the last edit date." }),
];

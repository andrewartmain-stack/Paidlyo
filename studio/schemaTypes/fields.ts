import { defineArrayMember, defineField, type SlugValidationContext } from "sanity";
import { CARD_ICONS } from "../../src/content/pages/icons";

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

/** Optional card icon from the site's fixed list (src/content/pages/icons.ts). */
export const iconField = defineField({
  name: "icon",
  title: "Icon (optional)",
  type: "string",
  options: { list: CARD_ICONS.map((icon) => ({ value: icon, title: icon })) },
});

/** Optional highlighted box under a section's text. */
export const calloutField = text("callout", "Highlighted box (optional)", {
  rows: 2,
  optional: true,
  description: "One or two sentences: the key takeaway or a tip.",
});

const card = defineArrayMember({
  type: "object",
  name: "card",
  fields: [text("title", "Title"), text("text", "Text", { rows: 3 }), iconField],
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

/** The three products (mirrors PRODUCT_SLUGS / PRODUCT_NAMES in src/content/pages/paths.ts). */
export const PRODUCTS = [
  { value: "invoicing", title: "Invoicing (/invoicing)" },
  { value: "time-tracking", title: "Time tracking (/time-tracking)" },
  { value: "time-tracking-and-invoicing", title: "Time tracking & invoicing (/time-tracking-and-invoicing)" },
];

export const productField = defineField({
  name: "product",
  title: "Product",
  type: "string",
  options: { list: PRODUCTS, layout: "radio" },
  validation: (rule) => rule.required(),
});

/** A slug may repeat across products (/invoicing/for/agencies and /time-tracking/for/agencies). */
async function uniqueWithinProduct(slug: string, context: SlugValidationContext): Promise<boolean> {
  const { document, getClient } = context;
  if (!document) return true;
  const id = document._id.replace(/^drafts\./, "");
  const count = await getClient({ apiVersion: "2025-02-06" }).fetch<number>(
    `count(*[_type == $type && product == $product && slug.current == $slug && !(_id in [$id, "drafts." + $id])])`,
    { type: document._type, product: document.product ?? null, slug, id },
  );
  return count === 0;
}

const keywords = defineField({
  name: "keywords",
  title: "Target keywords",
  type: "array",
  of: [{ type: "string" }],
  options: { layout: "tags" },
  description: "From the keyword research; not shown on the page.",
  validation: (rule) => rule.required().min(1),
});

/** Search fields every page has. */
export const pageSearch = [seo, keywords, image("cover", "Cover image (on cards linking here, and the share image)")];

/** Slug, then search fields. `perProduct`: the slug only has to be unique within its product. */
export const pageStart = (source: string, { perProduct = false } = {}) => [
  defineField({
    name: "slug",
    title: "Slug (URL)",
    type: "slug",
    options: { source, ...(perProduct && { isUnique: uniqueWithinProduct }) },
    validation: (rule) => rule.required(),
  }),
  ...pageSearch,
];

const hiddenWhenEmpty = ({ value }: { value?: unknown }) => !Array.isArray(value) || value.length === 0;

/** Fields of a text section, the same on every page type (guides add an anchor). */
export const sectionTextFields = [
  text("heading", "Heading"),
  text("body", "Text", {
    rows: 14,
    optional: true,
    description:
      'Formatting: **bold** · [link text](/invoicing/online) · "- " bullets · "1. " numbered · > "Quote" — Name, Company · | table | rows | · ### Subheading · blank line = new paragraph.',
  }),
  // Older plain fields: shown only on sections that already use them.
  defineField({ name: "paragraphs", title: "Paragraphs (old format)", type: "array", of: [{ type: "text", rows: 4 }], hidden: hiddenWhenEmpty }),
  defineField({ name: "bullets", title: "Bullets (old format)", type: "array", of: [{ type: "string" }], hidden: hiddenWhenEmpty }),
  defineField({
    name: "calloutKind",
    title: "Highlighted box type",
    type: "string",
    options: {
      list: [
        { value: "tip", title: "Tip (lightbulb)" },
        { value: "note", title: "Note (info)" },
        { value: "warning", title: "Warning" },
        { value: "stat", title: "Key number: start the box with the figure in **bold**" },
      ],
      layout: "radio",
      direction: "horizontal",
    },
    initialValue: "tip",
  }),
  calloutField,
  image("image", "Screenshot (optional)"),
];

/** A section needs its text: `body`, or the old paragraphs. */
export const sectionHasText = (value: unknown) => {
  const section = (value ?? {}) as { body?: string; paragraphs?: unknown[] };
  return section.body || section.paragraphs?.length ? true : "Add the section text";
};

/** Text sections with an optional screenshot each: required (1–8) on product pages, optional (≤ 5) elsewhere. */
export const sectionsField = ({ min, max }: { min: number; max: number }) =>
  defineField({
    name: "sections",
    title: "Sections",
    type: "array",
    of: [
      defineArrayMember({
        type: "object",
        name: "landingSection",
        fields: sectionTextFields,
        validation: (rule) => rule.custom(sectionHasText),
        preview: { select: { title: "heading", media: "image" } },
      }),
    ],
    validation: (rule) => (min > 0 ? rule.required().min(min).max(max) : rule.max(max)),
  });

/** Body of product and variant pages: sections with images, feature cards, screenshots, price. */
export const landingFields = [
  sectionsField({ min: 1, max: 8 }),
  defineField({
    name: "highlights",
    title: "Feature cards",
    type: "array",
    of: [
      defineArrayMember({
        type: "object",
        name: "highlight",
        fields: [text("title", "Title"), text("text", "Text", { rows: 3 }), iconField, text("href", "Link (optional)", { optional: true, description: "e.g. /features/timesheets" })],
        preview: { select: { title: "title", subtitle: "href" } },
      }),
    ],
    validation: (rule) => rule.max(6),
  }),
  screenshots,
  teamSizes,
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

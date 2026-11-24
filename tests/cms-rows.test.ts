import { describe, expect, it } from "vitest";
import { coerce, imageFiles, parseCsv, rowToContent, toRecords, toSanityDocument, unflatten, validateContent, type UploadedImage } from "@/content/pages/cms-rows";

const IMAGES = new Map<string, UploadedImage>([
  ["timer.png", { assetId: "image-abc-1600x1000-png", url: "https://cdn.sanity.io/images/f1ipt922/production/abc-1600x1000.png", width: 1600, height: 1000 }],
]);

const GUIDE_CSV = [
  "slug,title,description,author,seo.title,seo.description,keywords,cover.file,cover.alt,sections.1.id,sections.1.heading,sections.1.paragraphs,sections.1.bullets,# notes",
  'track-time,How to track billable hours,"Start a timer, then invoice.",Paidlyo team,How to Track Billable Hours | Paidlyo,A short guide.,track billable hours | billable hours,timer.png,The timer,start,Start a timer,"First ""paragraph"". | Second paragraph.",Pick a project | Press start,ignored',
  ",,,,,,,,,,,,,",
].join("\r\n");

describe("CSV parsing", () => {
  it("handles quotes, escaped quotes, commas and line breaks inside cells", () => {
    expect(parseCsv('a,b\n"x, y","say ""hi""\nthere"\n')).toEqual([
      ["a", "b"],
      ["x, y", 'say "hi"\nthere'],
    ]);
  });

  it("skips empty rows and note columns, keeping spreadsheet line numbers", () => {
    const records = toRecords(parseCsv(GUIDE_CSV));
    expect(records).toHaveLength(1);
    expect(records[0].line).toBe(2);
    expect(records[0].record).not.toHaveProperty("# notes");
  });
});

describe("row to content", () => {
  it("builds nested objects and 1-based lists from dotted headers", () => {
    expect(unflatten({ "seo.title": "T", "faq.2.question": "Q2", "faq.1.question": "Q1", "faq.1.answer": "A1" })).toEqual({
      seo: { title: "T" },
      faq: [{ question: "Q1", answer: "A1" }, { question: "Q2" }],
    });
  });

  it("splits | lists and converts numbers and flags", () => {
    expect(coerce({ keywords: "a | b", teamSizes: "1 | 5 | 15", pricing: { perPersonCents: "1200", billedAnnually: "Yes" } })).toEqual({
      keywords: ["a", "b"],
      teamSizes: [1, 5, 15],
      pricing: { perPersonCents: 1200, billedAnnually: true },
    });
    expect(coerce({ teamSizes: "1 | five" })).toEqual({ teamSizes: [1, "five"] });
  });

  it("lists every image the row uses", () => {
    expect(imageFiles(rowToContent({ "cover.file": "a.png", "sections.1.image.file": "b.png", "sections.2.image.file": "a.png" }))).toEqual([
      "a.png",
      "b.png",
    ]);
  });
});

describe("validation and Sanity documents", () => {
  const [{ record }] = toRecords(parseCsv(GUIDE_CSV));
  const content = rowToContent(record);

  it("accepts a complete guide row, defaulting its dates", () => {
    expect(validateContent("guide", content, IMAGES)).toEqual([]);
  });

  it("reports what is missing, by field", () => {
    const rest = Object.fromEntries(Object.entries(content).filter(([key]) => key !== "title"));
    expect(validateContent("guide", rest, IMAGES)).toEqual([expect.stringMatching(/^title: /)]);
    expect(validateContent("guide", { ...content, seo: { title: "x".repeat(61), description: "D" } }, IMAGES)[0]).toMatch(/^seo\.title: /);
  });

  it("builds a draft with a stable ID, slug, image references and array keys", () => {
    const doc = toSanityDocument("guide", content, IMAGES);
    expect(doc).toMatchObject({
      _id: "drafts.guidePage-track-time",
      _type: "guidePage",
      slug: { _type: "slug", current: "track-time" },
      cover: { _type: "image", asset: { _type: "reference", _ref: "image-abc-1600x1000-png" }, alt: "The timer" },
      sections: [{ _key: "k1", id: "start", paragraphs: ['First "paragraph".', "Second paragraph."], bullets: ["Pick a project", "Press start"] }],
    });
    expect(doc).not.toHaveProperty("cover.file");
    expect(toSanityDocument("guide", content, IMAGES, { publish: true })._id).toBe("guidePage-track-time");
  });

  it("identifies product, variant and audience documents by product", () => {
    const landing = { hero: { title: "T", description: "D" } };
    expect(toSanityDocument("product", { product: "invoicing", ...landing }, IMAGES, { publish: true })).toMatchObject({
      _id: "productPage-invoicing",
      _type: "productPage",
    });
    expect(toSanityDocument("product", { product: "invoicing", ...landing }, IMAGES)).not.toHaveProperty("slug");
    expect(toSanityDocument("variant", { product: "invoicing", slug: "free", ...landing }, IMAGES)._id).toBe("drafts.variantPage-invoicing-free");
    expect(toSanityDocument("audience", { product: "time-tracking", slug: "agencies", ...landing }, IMAGES)._id).toBe(
      "drafts.audiencePage-time-tracking-agencies",
    );
    expect(() => toSanityDocument("product", landing, IMAGES)).toThrow(/no product/);
  });

  it("validates a product row without a slug column", () => {
    const row = rowToContent({
      product: "invoicing",
      "seo.title": "Invoicing Software | Paidlyo",
      "seo.description": "Invoices from tracked time.",
      keywords: "invoicing software",
      "hero.title": "Invoicing",
      "hero.description": "Bill every hour.",
      "sections.1.heading": "Invoices",
      "sections.1.paragraphs": "One | Two",
      teamSizes: "1 | 5",
    });
    expect(validateContent("product", row, IMAGES)).toEqual([]);
    expect(validateContent("product", { ...row, product: "payroll" }, IMAGES)[0]).toMatch(/^product: /);
  });

  it("validates an audience row with optional text sections", () => {
    const row = rowToContent({
      product: "invoicing",
      slug: "small-business",
      name: "Small businesses",
      "seo.title": "Small Business Invoicing | Paidlyo",
      "seo.description": "Invoices from tracked time.",
      keywords: "small business invoicing",
      "hero.title": "Invoicing for small businesses",
      "hero.description": "Bill every hour.",
      "painPoints.1.title": "A", "painPoints.1.text": "a", "painPoints.2.title": "B", "painPoints.2.text": "b",
      "example.title": "Retainer", "example.description": "Monthly.",
      "example.rows.1.label": "Design", "example.rows.1.value": "$900", "example.rows.2.label": "Dev", "example.rows.2.value": "$1,100",
      "sections.1.heading": "How to choose",
      "sections.1.paragraphs": "One, with a comma. | Two",
      "sections.1.bullets": "Hours | Rates",
      "features.1.title": "T", "features.1.text": "t", "features.2.title": "I", "features.2.text": "i", "features.3.title": "R", "features.3.text": "r",
      teamSizes: "2 | 5",
    });
    expect(validateContent("audience", row, IMAGES)).toEqual([]);
    expect(row).toMatchObject({ sections: [{ heading: "How to choose", paragraphs: ["One, with a comma.", "Two"], bullets: ["Hours", "Rates"] }] });
  });

  it("refuses to build a document for an image that wasn't uploaded", () => {
    expect(() => toSanityDocument("guide", content, new Map())).toThrow(/timer\.png/);
  });
});

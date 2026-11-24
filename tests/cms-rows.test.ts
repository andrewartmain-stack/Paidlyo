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

  it("refuses to build a document for an image that wasn't uploaded", () => {
    expect(() => toSanityDocument("guide", content, new Map())).toThrow(/timer\.png/);
  });
});

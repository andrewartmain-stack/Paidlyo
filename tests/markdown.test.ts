import { describe, expect, it } from "vitest";
import { invalidLinks, isLinkable, parseBlocks, parseInline, plainText } from "@/content/pages/markdown";
import { rowToContent } from "@/content/pages/cms-rows";
import { guideSchema } from "@/content/pages/schema";
import { GUIDE_PAGES } from "@/content/pages/guides";

describe("inline formatting", () => {
  it("parses bold and links, including bold inside a link", () => {
    expect(parseInline("Track **billable hours** and [invoice **them**](/invoicing).")).toEqual([
      { type: "text", text: "Track " },
      { type: "bold", children: [{ type: "text", text: "billable hours" }] },
      { type: "text", text: " and " },
      { type: "link", href: "/invoicing", children: [{ type: "text", text: "invoice " }, { type: "bold", children: [{ type: "text", text: "them" }] }] },
      { type: "text", text: "." },
    ]);
  });

  it("leaves plain text alone", () => {
    expect(parseInline("$9 per person, 2 * 3")).toEqual([{ type: "text", text: "$9 per person, 2 * 3" }]);
  });
});

describe("blocks", () => {
  const body = [
    "First line",
    "continues here.",
    "",
    "### Subheading",
    "- one",
    "- two",
    "",
    "1. step",
    "2. next",
    "",
    '> "Saved us hours." — Ana, Studio North',
    "",
    "| Size | Price |",
    "|---|---:|",
    "| 5 people | $45 |",
  ].join("\r\n");

  it("parses paragraphs, subheadings, lists, quotes and tables", () => {
    const blocks = parseBlocks(body);
    expect(blocks.map((block) => block.type)).toEqual(["paragraph", "heading", "list", "list", "quote", "table"]);
    expect(blocks[0]).toEqual({ type: "paragraph", content: [{ type: "text", text: "First line continues here." }] });
    expect(blocks[2]).toMatchObject({ ordered: false, items: [[{ text: "one" }], [{ text: "two" }]] });
    expect(blocks[3]).toMatchObject({ ordered: true });
    expect(blocks[4]).toEqual({ type: "quote", content: [{ type: "text", text: "Saved us hours." }], cite: "Ana, Studio North" });
    expect(blocks[5]).toEqual({
      type: "table",
      head: [[{ type: "text", text: "Size" }], [{ type: "text", text: "Price" }]],
      rows: [[[{ type: "text", text: "5 people" }], [{ type: "text", text: "$45" }]]],
    });
  });

  it("turns Markdown into plain text for structured data", () => {
    expect(plainText("Use **bold** and [a link](/x).\n- item")).toBe("Use bold and a link. item");
  });
});

describe("links", () => {
  it("accepts internal paths and https, rejects the rest", () => {
    expect(invalidLinks("[a](/pricing) [b](https://example.com) [c](pricing) [d](http://x.com)")).toEqual(["pricing", "http://x.com"]);
  });

  it("links only to pages that exist, ignoring anchors", () => {
    const live = new Set(["/pricing", "/invoicing"]);
    expect(isLinkable("/invoicing#faq", live)).toBe(true);
    expect(isLinkable("/invoicing/online", live)).toBe(false);
    expect(isLinkable("https://www.getharvest.com/pricing", live)).toBe(true);
  });

  it("rejects a section body with a bad link and needs text in each section", () => {
    const [guide] = GUIDE_PAGES;
    const section = (fields: object) => ({ ...guide, sections: [{ id: "a", heading: "A", ...fields }] });
    expect(guideSchema.safeParse(section({ body: "See [pricing](pricing)." })).success).toBe(false);
    expect(guideSchema.safeParse(section({})).success).toBe(false);
    expect(guideSchema.parse(section({ body: "See [pricing](/pricing)." })).sections[0]).toMatchObject({ calloutKind: "tip", paragraphs: [] });
  });
});

describe("CSV section cells", () => {
  it("keeps line breaks in body and reads the callout kind", () => {
    const row = rowToContent({ "sections.1.heading": "H", "sections.1.body": "Line one.\n\n- a | b", "sections.1.calloutKind": "stat" });
    expect(row).toEqual({ sections: [{ heading: "H", body: "Line one.\n\n- a | b", calloutKind: "stat" }] });
  });
});

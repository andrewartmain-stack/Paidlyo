import { describe, expect, it } from "vitest";
import { buildDirectory, DIRECTORY_LIMIT, navLabel, type DirectoryPage } from "@/content/pages/directory";

const page = (href: string, navLabel: string, type: DirectoryPage["type"], product?: DirectoryPage["product"]): DirectoryPage => ({
  href,
  navLabel,
  type,
  ...(product && { product }),
});

const build = (pages: DirectoryPage[], extra: string[] = []) => buildDirectory(pages, new Set([...pages.map((p) => p.href), ...extra]));
const sectionOf = (pages: DirectoryPage[], title: string, extra: string[] = []) =>
  build(pages, extra)
    .flatMap((group) => group.sections)
    .find((section) => section.title === title);

describe("site directory (header menu and footer)", () => {
  it("is empty while nothing is published", () => {
    expect(build([])).toEqual([]);
  });

  it("groups pages into Product, Solutions and Resources", () => {
    const groups = build([
      page("/invoicing", "Invoicing software", "product", "invoicing"),
      page("/invoicing/online", "Online invoicing", "variant", "invoicing"),
      page("/features/timer", "Timer", "feature"),
      page("/time-tracking/for/agencies", "Agencies", "audience", "time-tracking"),
      page("/guides/what-is-x", "What is x?", "guide"),
    ]);
    expect(groups.map((group) => [group.label, group.sections.map((section) => section.title)])).toEqual([
      ["Product", ["Invoicing", "Features"]],
      ["Solutions", ["Time tracking for…"]],
      ["Resources", ["Guides"]],
    ]);
  });

  it("links a product's overview only once the product page is published", () => {
    const variant = page("/invoicing/online", "Online invoicing", "variant", "invoicing");
    expect(sectionOf([variant], "Invoicing")?.all).toBeUndefined();
    expect(sectionOf([variant, page("/invoicing", "Invoicing software", "product", "invoicing")], "Invoicing")?.all?.href).toBe("/invoicing");
  });

  it("keeps audiences under their own product, sorted by name", () => {
    const pages = [
      page("/invoicing/for/law-firms", "Law firms", "audience", "invoicing"),
      page("/invoicing/for/agencies", "Agencies", "audience", "invoicing"),
      page("/time-tracking/for/developers", "Developers", "audience", "time-tracking"),
    ];
    expect(sectionOf(pages, "Invoicing for…")?.links.map((link) => link.label)).toEqual(["Agencies", "Law firms"]);
  });

  it("shows up to the limit and counts the rest behind the overview link", () => {
    const pages = Array.from({ length: DIRECTORY_LIMIT + 3 }, (_, i) => page(`/alternatives/tool-${i}`, `Tool ${String(i).padStart(2, "0")} alternative`, "alternative"));
    const section = sectionOf(pages, "Alternatives", ["/alternatives"]);
    expect(section?.links).toHaveLength(DIRECTORY_LIMIT);
    expect(section?.more).toBe(3);
    expect(section?.all).toEqual({ href: "/alternatives", label: "All alternatives" });
  });
});

describe("menu labels", () => {
  it("uses short names", () => {
    expect(navLabel("alternative", { competitor: "Toggl Track" })).toBe("Toggl Track alternative");
    expect(navLabel("comparison", { kind: "versus", tools: [{ name: "Harvest" }, { name: "Toggl Track" }] })).toBe("Harvest vs Toggl Track");
    expect(navLabel("comparison", { kind: "pricing", tools: [{ name: "Harvest" }] })).toBe("Harvest pricing");
    expect(navLabel("audience", { name: "Law firms" })).toBe("Law firms");
    expect(navLabel("product", { product: "time-tracking" })).toBe("Time tracking software");
  });

  it("keeps only the question of a guide title", () => {
    expect(navLabel("guide", { title: "What is the best invoicing software? It depends on how you bill" })).toBe(
      "What is the best invoicing software?",
    );
    expect(navLabel("guide", { title: "What is time tracking software, and which kind does your business need?" })).toBe(
      "What is time tracking software?",
    );
    expect(navLabel("guide", { title: "How to bill hours, step by step" })).toBe("How to bill hours");
  });
});

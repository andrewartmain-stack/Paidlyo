import { describe, expect, it } from "vitest";
import { AUDIENCE_FALLBACK, resolveNavGroups } from "@/components/marketing/nav-icons";
import { NAV_GROUPS } from "@/content/landing";
import type { INDEX_PATHS } from "@/content/pages/paths";

const resolve = (indexes: (keyof typeof INDEX_PATHS)[], audiences: [string, string][] = []) =>
  resolveNavGroups(NAV_GROUPS, { audiencePaths: new Map(audiences), liveIndexes: new Set(indexes) });

describe("header navigation", () => {
  it("hides Resources and the All solutions link while nothing is published", () => {
    const groups = resolve([]);
    expect(groups.map((g) => g.label)).toEqual(["Product", "Solutions"]);
    const solutions = groups.find((g) => g.label === "Solutions");
    expect(solutions?.footer).toBeUndefined();
    expect(solutions?.items.every((item) => item.href === AUDIENCE_FALLBACK)).toBe(true);
  });

  it("shows only the index pages that have content", () => {
    const resources = resolve(["guide", "comparison"]).find((g) => g.label === "Resources");
    expect(resources?.items.map((item) => [item.title, item.href])).toEqual([
      ["Guides", "/guides"],
      ["Comparisons", "/compare"],
    ]);
  });

  it("links published audiences and the audience index", () => {
    const solutions = resolve(["audience"], [["agencies", "/for/agencies"]]).find((g) => g.label === "Solutions");
    expect(solutions?.footer).toEqual({ label: "All solutions", href: "/for" });
    expect(solutions?.items[0].href).toBe("/for/agencies");
    expect(solutions?.items[1].href).toBe(AUDIENCE_FALLBACK);
  });

  it("keeps fixed footers like All features", () => {
    expect(resolve([]).find((g) => g.label === "Product")?.footer).toEqual({ href: "/#features", label: "All features" });
  });
});

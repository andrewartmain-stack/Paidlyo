import { describe, expect, it } from "vitest";
import { resolveNavGroups } from "@/components/marketing/nav-icons";
import { AUDIENCE_PAGES, NAV_GROUPS } from "@/content/landing";

const resolve = (live: string[]) => resolveNavGroups(NAV_GROUPS, new Set(live));
const group = (live: string[], label: string) => resolve(live).find((g) => g.label === label);

describe("header navigation", () => {
  it("shows only fixed links while nothing is published", () => {
    expect(resolve([]).map((g) => g.label)).toEqual(["Product", "Solutions"]);
    expect(group([], "Product")?.items.some((item) => item.href === "/invoicing")).toBe(false);
    expect(group([], "Solutions")?.items.every((item) => item.href === "/#who-its-for")).toBe(true);
  });

  it("adds product pages to the Product menu once published", () => {
    const items = group(["/invoicing"], "Product")?.items ?? [];
    expect(items[0]).toMatchObject({ title: "Invoicing software", href: "/invoicing" });
    expect(items.some((item) => item.href === "/time-tracking")).toBe(false);
  });

  it("links audiences to their product's audience page once published", () => {
    const solutions = group([AUDIENCE_PAGES["small-business"]], "Solutions");
    expect(solutions?.items.find((item) => item.title.startsWith("Small"))?.href).toBe("/invoicing/for/small-business");
    expect(solutions?.items.find((item) => item.title.startsWith("Agencies"))?.href).toBe("/#who-its-for");
  });

  it("shows only the index pages that have content", () => {
    expect(group(["/guides", "/compare"], "Resources")?.items.map((item) => item.href)).toEqual(["/guides", "/compare"]);
  });

  it("keeps fixed footers like All features", () => {
    expect(group([], "Product")?.footer).toEqual({ href: "/#features", label: "All features" });
  });
});

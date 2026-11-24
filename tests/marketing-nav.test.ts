import { describe, expect, it } from "vitest";
import { resolveNavGroups } from "@/components/marketing/nav-icons";
import { AUDIENCE_PAGES, NAV_GROUPS } from "@/content/landing";

const resolve = (live: string[]) => resolveNavGroups(NAV_GROUPS, new Set(live));
const group = (live: string[], label: string) => resolve(live).find((g) => g.label === label);

describe("header navigation", () => {
  it("shows no dropdowns while nothing is published", () => {
    expect(resolve([])).toEqual([]);
  });

  it("links only published pages, never placeholders", () => {
    const hrefs = resolve(["/invoicing", "/features/timesheets", AUDIENCE_PAGES.agencies, "/guides"]).flatMap((g) => g.items.map((item) => item.href));
    expect(hrefs).toEqual(["/invoicing", "/features/timesheets", AUDIENCE_PAGES.agencies, "/guides"]);
  });

  it("lists products before features in the Product menu", () => {
    const items = group(["/features/reports", "/invoicing"], "Product")?.items ?? [];
    expect(items.map((item) => item.href)).toEqual(["/invoicing", "/features/reports"]);
  });

  it("shows only the index pages that have content", () => {
    expect(group(["/guides", "/compare"], "Resources")?.items.map((item) => item.href)).toEqual(["/guides", "/compare"]);
  });

  it("adds All features once the /features index exists", () => {
    expect(group(["/invoicing"], "Product")?.footer).toBeUndefined();
    expect(group(["/invoicing", "/features/reports", "/features"], "Product")?.footer).toEqual({ href: "/features", label: "All features" });
  });
});

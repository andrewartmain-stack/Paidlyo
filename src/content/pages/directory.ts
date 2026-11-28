import type { NavIconKey } from "../landing";
import { INDEX_PATHS, PAGE_PATHS, PRODUCT_NAMES, PRODUCT_SLUGS, type PageType, type ProductSlug } from "./paths";

/*
 * Site directory: every published page, grouped the same way in the header menu and the footer.
 * Built from what's published, so a page shows up in both the moment it goes live in Sanity.
 */

/** Pages shown per section; the rest are one click away on the section's overview page. */
export const DIRECTORY_LIMIT = 12;

export type DirectoryLink = { href: string; label: string };

export type DirectorySection = {
  title: string;
  description: string;
  icon: NavIconKey;
  links: DirectoryLink[];
  /** Pages left out by DIRECTORY_LIMIT. */
  more: number;
  /** The page that lists everything in this section (a product or index page), once it exists. */
  all?: DirectoryLink;
};

export type DirectoryGroup = { label: string; sections: DirectorySection[] };

/** What the directory needs from a published page. */
export type DirectoryPage = { href: string; navLabel: string; type: PageType; product?: ProductSlug };

const PRODUCT_COPY: Record<ProductSlug, { description: string; icon: NavIconKey }> = {
  invoicing: { description: "Invoices from tracked time.", icon: "invoice" },
  "time-tracking": { description: "Timers and timesheets.", icon: "clock" },
  "time-tracking-and-invoicing": { description: "Hours and invoices in one tool.", icon: "bundle" },
};

const byLabel = (a: DirectoryLink, b: DirectoryLink) => a.label.localeCompare(b.label);

/**
 * The site directory for these published pages. `live` is every URL that exists now (pages and
 * index pages): a section's overview link shows only once its page does. Empty sections and
 * groups are left out.
 */
export function buildDirectory(pages: DirectoryPage[], live: Set<string>): DirectoryGroup[] {
  const of = (type: PageType, product?: ProductSlug) =>
    pages.filter((page) => page.type === type && (!product || page.product === product)).map((page) => ({ href: page.href, label: page.navLabel }));

  const section = (
    title: string,
    description: string,
    icon: NavIconKey,
    links: DirectoryLink[],
    all?: DirectoryLink,
    // A product's section shows even without sub-pages: it links the product page itself.
    { sort = true, keepEmpty = false } = {},
  ): DirectorySection[] => {
    const allLink = all && live.has(all.href) ? all : undefined;
    const sorted = sort ? [...links].sort(byLabel) : links;
    if (sorted.length === 0 && !(keepEmpty && allLink)) return [];
    return [
      {
        title,
        description,
        icon,
        links: sorted.slice(0, DIRECTORY_LIMIT),
        more: Math.max(0, sorted.length - DIRECTORY_LIMIT),
        ...(allLink && { all: allLink }),
      },
    ];
  };

  const products = PRODUCT_SLUGS.flatMap((product) =>
    section(
      PRODUCT_NAMES[product],
      PRODUCT_COPY[product].description,
      PRODUCT_COPY[product].icon,
      of("variant", product),
      { href: PAGE_PATHS.product(product), label: `${PRODUCT_NAMES[product]} software overview` },
      { keepEmpty: true },
    ),
  );
  const features = section("Features", "Everything Paidlyo does.", "features", of("feature"), {
    href: INDEX_PATHS.feature,
    label: "All features",
  });
  const solutions = PRODUCT_SLUGS.flatMap((product) =>
    section(
      `${PRODUCT_NAMES[product]} for…`,
      "By industry and team type.",
      product === "invoicing" ? "business" : "agency",
      of("audience", product),
      // The product page lists all of its audience pages.
      { href: PAGE_PATHS.product(product), label: `All ${PRODUCT_NAMES[product].toLowerCase()} solutions` },
    ),
  );
  const resources = [
    ...section("Alternatives", "Switching from another tool.", "switch", of("alternative"), {
      href: INDEX_PATHS.alternative,
      label: "All alternatives",
    }),
    ...section("Comparisons", "Tools side by side, with prices.", "compare", of("comparison"), {
      href: INDEX_PATHS.comparison,
      label: "All comparisons",
    }),
    ...section("Guides", "Answers on tracking and billing.", "guide", of("guide"), {
      href: INDEX_PATHS.guide,
      label: "All guides",
    }, { sort: false }),
  ];

  return [
    { label: "Product", sections: [...products, ...features] },
    { label: "Solutions", sections: solutions },
    { label: "Resources", sections: resources },
  ].filter((group) => group.sections.length > 0);
}

/** Short name of a page for menus: "Agencies", "Toggl Track alternative", "Harvest vs Toggl Track". */
export function navLabel(
  type: PageType,
  page: { name?: string; competitor?: string; title?: string; kind?: string; tools?: { name: string }[]; product?: ProductSlug; hero?: { title: string } },
): string {
  if (type === "product" && page.product) return `${PRODUCT_NAMES[page.product]} software`;
  if (type === "alternative" && page.competitor) return `${page.competitor} alternative`;
  if (type === "comparison" && page.tools?.length) {
    return page.kind === "pricing" ? `${page.tools[0].name} pricing` : page.tools.map((tool) => tool.name).join(" vs ");
  }
  if (page.name) return page.name;
  const title = page.title ?? page.hero?.title ?? "";
  // A guide's title is a question, often with a tail: keep the question.
  const end = title.indexOf("?");
  if (end < 0) return title.split(/[,:] /)[0];
  const question = title.slice(0, end + 1);
  // "What is X, and which kind do you need?" → "What is X?"
  return question.length > 50 && question.includes(", ") ? `${question.split(", ")[0]}?` : question;
}

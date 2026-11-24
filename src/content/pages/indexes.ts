import { getPages, type ReadOptions } from "./index";
import { INDEX_PATHS, PAGE_PATHS } from "./paths";
import { published } from "./schema";

/*
 * Index pages for audiences, guides, alternatives and comparisons (features has its own page). Each one
 * links to every published page of its type, so no page depends on the sitemap alone to be
 * found. An index stays noindex, out of the sitemap and out of the footer until it has a page.
 */

export type IndexType = keyof typeof INDEX_PATHS;

export type IndexItem = { href: string; title: string; text: string; linkLabel: string };

export const INDEX_COPY = {
  audience: {
    label: "Solutions",
    seo: {
      title: "Time Tracking Software for Every Team | Paidlyo",
      description:
        "Time tracking and invoicing for agencies, consultancies, freelancers and small businesses: see how Paidlyo fits the way your team bills clients.",
    },
    title: "Who Paidlyo is for",
    description: "How agencies, consultancies, freelancers and small teams track time and bill clients with Paidlyo.",
    empty: "Pages for each kind of team are on their way.",
  },
  guide: {
    label: "Guides",
    seo: {
      title: "Time Tracking & Invoicing Guides | Paidlyo",
      description:
        "Practical guides on tracking billable hours, timesheets, invoicing clients and getting paid faster, for agencies, consultancies and teams.",
    },
    title: "Time tracking and invoicing guides",
    description: "Straight answers on tracking billable hours, invoicing clients and getting paid.",
    empty: "The first guides are on their way.",
  },
  alternative: {
    label: "Alternatives",
    seo: {
      title: "Time Tracking Software Alternatives | Paidlyo",
      description:
        "Switching time tracking or invoicing tools? See how Paidlyo compares on features and price per person, and how to move your data over.",
    },
    title: "Alternatives to popular time tracking tools",
    description: "What you get, what it costs and how to move your data when you switch to Paidlyo.",
    empty: "Comparisons with other tools are on their way.",
  },
  comparison: {
    label: "Comparisons",
    seo: {
      title: "Time Tracking Software Comparisons | Paidlyo",
      description:
        "Time tracking and invoicing tools compared side by side: features, price per person and total cost for your team size, checked against public pricing.",
    },
    title: "Time tracking software compared",
    description: "Features and prices side by side, with the total cost for your team size.",
    empty: "Side-by-side comparisons are on their way.",
  },
} satisfies Record<Exclude<IndexType, "feature">, unknown>;

/** Cards for one index page: its published pages, in publishing order. */
export async function indexItems(type: Exclude<IndexType, "feature">): Promise<IndexItem[]> {
  if (type === "audience") {
    return published(await getPages("audience")).map((page) => ({
      href: PAGE_PATHS.audience(page.slug),
      title: page.name,
      text: page.hero.description,
      linkLabel: `Paidlyo for ${page.name.toLowerCase()}`,
    }));
  }
  if (type === "guide") {
    return published(await getPages("guide")).map((page) => ({
      href: PAGE_PATHS.guide(page.slug),
      title: page.title,
      text: page.description,
      linkLabel: "Read the guide",
    }));
  }
  if (type === "alternative") {
    return published(await getPages("alternative")).map((page) => ({
      href: PAGE_PATHS.alternative(page.slug),
      title: `${page.competitor} alternative`,
      text: page.hero.description,
      linkLabel: `Paidlyo vs ${page.competitor}`,
    }));
  }
  return published(await getPages("comparison")).map((page) => ({
    href: PAGE_PATHS.comparison(page.slug),
    title: page.hero.title,
    text: page.hero.description,
    linkLabel: "See the comparison",
  }));
}

/** Index pages that have at least one published page, for the footer and the sitemap. */
export async function liveIndexes(options: ReadOptions = {}): Promise<{ type: IndexType; path: string; label: string }[]> {
  const [audiences, features, guides, alternatives, comparisons] = await Promise.all([
    getPages("audience", options),
    getPages("feature", options),
    getPages("guide", options),
    getPages("alternative", options),
    getPages("comparison", options),
  ]);
  const counts: Record<IndexType, number> = {
    audience: published(audiences).length,
    feature: published(features).length,
    guide: published(guides).length,
    alternative: published(alternatives).length,
    comparison: published(comparisons).length,
  };
  const labels: Record<IndexType, string> = {
    audience: INDEX_COPY.audience.label,
    feature: "Features",
    guide: INDEX_COPY.guide.label,
    alternative: INDEX_COPY.alternative.label,
    comparison: INDEX_COPY.comparison.label,
  };
  return (Object.keys(INDEX_PATHS) as IndexType[])
    .filter((type) => counts[type] > 0)
    .map((type) => ({ type, path: INDEX_PATHS[type], label: labels[type] }));
}

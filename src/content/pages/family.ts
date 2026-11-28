import { pageCards, type PageCard } from "./cards";
import { coverFor } from "./covers";
import { productFamily } from "./index";
import { plainText } from "./markdown";
import { PAGE_PATHS, PRODUCT_NAMES, type ProductSlug } from "./paths";

/*
 * Links inside one product's family (/invoicing, /invoicing/free, /invoicing/for/agencies …):
 * the product page links down to every sub-page, and each sub-page links up and across.
 */

export type FamilyLink = Pick<PageCard, "href" | "title" | "text" | "image"> & { type?: PageCard["type"] };

export async function familyLinks(product: ProductSlug) {
  const { variants, audiences } = await productFamily(product);
  return {
    variants: variants.map((page): FamilyLink => ({
      href: PAGE_PATHS.variant(product, page.slug),
      title: page.name,
      text: plainText(page.hero.description),
      type: "variant",
      image: coverFor(PAGE_PATHS.variant(product, page.slug), page, page.hero.title),
    })),
    audiences: audiences.map((page): FamilyLink => ({
      href: PAGE_PATHS.audience(product, page.slug),
      title: `For ${page.name.toLowerCase()}`,
      text: plainText(page.hero.description),
      type: "audience",
      image: coverFor(PAGE_PATHS.audience(product, page.slug), page, page.hero.title),
    })),
  };
}

/** Breadcrumb to the product page, only once it's published (never link to a 404). */
export function productCrumb(product: ProductSlug, live: Set<string>) {
  const path = PAGE_PATHS.product(product);
  return live.has(path) ? [{ name: PRODUCT_NAMES[product], path }] : [];
}

/** "More …" links for a sub-page: the product page (if live), then siblings, without the page itself. */
export async function siblingLinks(product: ProductSlug, currentPath: string, live: Set<string>, limit = 6): Promise<FamilyLink[]> {
  const { variants, audiences } = await familyLinks(product);
  const hubCard = live.has(PAGE_PATHS.product(product)) ? (await pageCards()).get(PAGE_PATHS.product(product)) : undefined;
  const hub: FamilyLink[] = hubCard
    ? [{ href: hubCard.href, title: hubCard.title, image: hubCard.image, type: hubCard.type, text: `Everything about ${PRODUCT_NAMES[product].toLowerCase()} in Paidlyo.` }]
    : [];
  return [...hub, ...audiences, ...variants].filter((link) => link.href !== currentPath).slice(0, limit);
}

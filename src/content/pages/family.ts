import { productFamily } from "./index";
import { PAGE_PATHS, PRODUCT_NAMES, type ProductSlug } from "./paths";

/*
 * Links inside one product's family (/invoicing, /invoicing/free, /invoicing/for/agencies …):
 * the product page links down to every sub-page, and each sub-page links up and across.
 */

export type FamilyLink = { href: string; title: string; text: string };

export async function familyLinks(product: ProductSlug) {
  const { variants, audiences } = await productFamily(product);
  return {
    variants: variants.map((page): FamilyLink => ({ href: PAGE_PATHS.variant(product, page.slug), title: page.name, text: page.hero.description })),
    audiences: audiences.map((page): FamilyLink => ({
      href: PAGE_PATHS.audience(product, page.slug),
      title: `For ${page.name.toLowerCase()}`,
      text: page.hero.description,
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
  const hub = live.has(PAGE_PATHS.product(product))
    ? [{ href: PAGE_PATHS.product(product), title: PRODUCT_NAMES[product], text: `Everything about ${PRODUCT_NAMES[product].toLowerCase()} in Paidlyo.` }]
    : [];
  return [...hub, ...audiences, ...variants].filter((link) => link.href !== currentPath).slice(0, limit);
}

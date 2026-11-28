import { PRODUCT_NAMES, type PageType, type ProductSlug } from "./paths";
import type { Screenshot } from "./schema";

/*
 * Every page has a cover: the image uploaded in Sanity, or a branded one generated from its title
 * at /covers/<page path> (src/app/covers/[...path]/route.tsx). Shown on cards linking to the page
 * and used as its share image.
 */

/** 16:10, like the cards. Text stays in the middle band so a 1.91:1 social crop keeps it. */
export const COVER_SIZE = { width: 1600, height: 1000 } as const;

export function generatedCover(path: string, alt: string): Screenshot {
  return { src: `/covers${path}`, ...COVER_SIZE, alt };
}

/** The page's own cover, else the generated one. */
export function coverFor(path: string, page: { cover?: Screenshot }, alt: string): Screenshot {
  return page.cover ?? generatedCover(path, alt);
}

type LabelPage = { product?: ProductSlug; name?: string };

/** The small label on a generated cover: "Invoicing · For small businesses", "Guide" … */
export function coverLabel(type: PageType, page: LabelPage): string {
  const product = page.product ? PRODUCT_NAMES[page.product] : "";
  switch (type) {
    case "product":
      return "Paidlyo";
    case "variant":
      return product;
    case "audience":
      return `${product} · For ${page.name?.toLowerCase() ?? ""}`;
    case "feature":
      return "Feature";
    case "alternative":
      return "Alternative";
    case "comparison":
      return "Comparison";
    case "guide":
      return "Guide";
  }
}

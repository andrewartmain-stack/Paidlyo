import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LandingTemplate } from "@/components/marketing/templates/landing-template";
import { getPages } from "@/content/pages";
import { familyLinks } from "@/content/pages/family";
import { isProduct, PAGE_PATHS, PRODUCT_NAMES, PRODUCT_SLUGS } from "@/content/pages/paths";
import { findPage } from "@/content/pages/schema";
import { coverShareImage, marketingMetadata } from "@/lib/seo";

/*
 * Product pages: /invoicing, /time-tracking, /time-tracking-and-invoicing (Product page in
 * Sanity). Fixed routes (/pricing, /features, …) always win over this segment; any other first
 * segment 404s.
 */

export async function generateStaticParams() {
  const products = (await getPages("product")).map((page) => ({ product: page.product }));
  // Cache Components needs at least one param; it 404s until that product page is published.
  return products.length > 0 ? products : [{ product: PRODUCT_SLUGS[0] }];
}

async function load(product: string) {
  return isProduct(product) ? findPage(await getPages("product"), product, product) : undefined;
}

export async function generateMetadata({ params }: PageProps<"/[product]">): Promise<Metadata> {
  const page = await load((await params).product);
  if (!page) return {};
  return marketingMetadata({
    title: page.seo.title,
    description: page.seo.description,
    path: PAGE_PATHS.product(page.product),
    image: coverShareImage(page.cover),
  });
}

export default async function Page({ params }: PageProps<"/[product]">) {
  const page = await load((await params).product);
  if (!page) notFound();
  const name = PRODUCT_NAMES[page.product];
  const { variants, audiences } = await familyLinks(page.product);
  return (
    <LandingTemplate
      page={page}
      crumbs={[
        { name: "Home", path: "/" },
        { name, path: PAGE_PATHS.product(page.product) },
      ]}
      linkGroups={[
        { id: "audiences", eyebrow: "Who it's for", title: `${name} for your kind of business`, links: audiences },
        { id: "variants", eyebrow: "More", title: `More about ${name.toLowerCase()} in Paidlyo`, links: variants },
      ]}
    />
  );
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LandingTemplate } from "@/components/marketing/templates/landing-template";
import { getPages, livePaths } from "@/content/pages";
import { productCrumb, siblingLinks } from "@/content/pages/family";
import { isProduct, PAGE_PATHS, PRODUCT_NAMES } from "@/content/pages/paths";
import { findPage } from "@/content/pages/schema";
import { coverShareImage, marketingMetadata } from "@/lib/seo";

/* Variant pages: /invoicing/free, /time-tracking/mac … (Product variant in Sanity). */

export async function generateStaticParams() {
  return (await getPages("variant")).map((page) => ({ product: page.product, variant: page.slug }));
}

async function load({ product, variant }: { product: string; variant: string }) {
  return isProduct(product) ? findPage(await getPages("variant"), variant, product) : undefined;
}

export async function generateMetadata({ params }: PageProps<"/[product]/[variant]">): Promise<Metadata> {
  const page = await load(await params);
  if (!page) return {};
  return marketingMetadata({
    title: page.seo.title,
    description: page.seo.description,
    path: PAGE_PATHS.variant(page.product, page.slug),
    noindex: page.preview,
    image: coverShareImage(page.cover, PAGE_PATHS.variant(page.product, page.slug), page.hero.title),
  });
}

export default async function Page({ params }: PageProps<"/[product]/[variant]">) {
  const page = await load(await params);
  if (!page) notFound();
  const path = PAGE_PATHS.variant(page.product, page.slug);
  const live = await livePaths();
  return (
    <LandingTemplate
      page={page}
      crumbs={[{ name: "Home", path: "/" }, ...productCrumb(page.product, live), { name: page.name, path }]}
      linkGroups={[
        {
          id: "more",
          eyebrow: "More",
          title: `More about ${PRODUCT_NAMES[page.product].toLowerCase()} in Paidlyo`,
          links: await siblingLinks(page.product, path, live),
        },
      ]}
    />
  );
}

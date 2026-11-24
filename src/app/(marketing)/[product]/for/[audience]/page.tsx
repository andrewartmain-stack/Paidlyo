import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AudienceTemplate } from "@/components/marketing/templates/audience-template";
import { getPages, livePaths } from "@/content/pages";
import { productCrumb, siblingLinks } from "@/content/pages/family";
import { isProduct, PAGE_PATHS } from "@/content/pages/paths";
import { findPage } from "@/content/pages/schema";
import { coverShareImage, marketingMetadata } from "@/lib/seo";

/* Audience pages: /invoicing/for/small-business, /time-tracking/for/agencies … (Audience page in Sanity). */

export async function generateStaticParams() {
  return (await getPages("audience")).map((page) => ({ product: page.product, audience: page.slug }));
}

async function load({ product, audience }: { product: string; audience: string }) {
  return isProduct(product) ? findPage(await getPages("audience"), audience, product) : undefined;
}

export async function generateMetadata({ params }: PageProps<"/[product]/for/[audience]">): Promise<Metadata> {
  const page = await load(await params);
  if (!page) return {};
  return marketingMetadata({
    title: page.seo.title,
    description: page.seo.description,
    path: PAGE_PATHS.audience(page.product, page.slug),
    noindex: page.preview,
    image: coverShareImage(page.cover),
  });
}

export default async function Page({ params }: PageProps<"/[product]/for/[audience]">) {
  const page = await load(await params);
  if (!page) notFound();
  const path = PAGE_PATHS.audience(page.product, page.slug);
  const live = await livePaths();
  return (
    <AudienceTemplate
      page={page}
      crumbs={[{ name: "Home", path: "/" }, ...productCrumb(page.product, live), { name: `For ${page.name.toLowerCase()}`, path }]}
      siblings={await siblingLinks(page.product, path, live)}
    />
  );
}

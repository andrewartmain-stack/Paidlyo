import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ComparisonTemplate } from "@/components/marketing/templates/comparison-template";
import { getPages } from "@/content/pages";
import { PAGE_PATHS } from "@/content/pages/paths";
import { findPage } from "@/content/pages/schema";
import { coverShareImage, marketingMetadata } from "@/lib/seo";

/*
 * Pages from Sanity (studio/) plus the template preview in src/content/pages/comparisons.ts. Slugs published
 * after the build render on first request and are cached; unknown slugs 404.
 */

export async function generateStaticParams() {
  return (await getPages("comparison")).map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }: PageProps<"/compare/[slug]">): Promise<Metadata> {
  const page = findPage(await getPages("comparison"), (await params).slug);
  if (!page) return {};
  return marketingMetadata({
    title: page.seo.title,
    description: page.seo.description,
    path: PAGE_PATHS.comparison(page.slug),
    noindex: page.preview,
    image: coverShareImage(page.cover, PAGE_PATHS.comparison(page.slug), page.hero.title),
  });
}

export default async function Page({ params }: PageProps<"/compare/[slug]">) {
  const page = findPage(await getPages("comparison"), (await params).slug);
  if (!page) notFound();
  return <ComparisonTemplate page={page} />;
}

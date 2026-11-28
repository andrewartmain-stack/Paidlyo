import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FeatureTemplate } from "@/components/marketing/templates/feature-template";
import { getPages } from "@/content/pages";
import { PAGE_PATHS } from "@/content/pages/paths";
import { findPage } from "@/content/pages/schema";
import { coverShareImage, marketingMetadata } from "@/lib/seo";

/*
 * Pages from Sanity (studio/) plus the template preview in src/content/pages/features.ts. Slugs published
 * after the build render on first request and are cached; unknown slugs 404.
 */

export async function generateStaticParams() {
  return (await getPages("feature")).map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }: PageProps<"/features/[slug]">): Promise<Metadata> {
  const page = findPage(await getPages("feature"), (await params).slug);
  if (!page) return {};
  return marketingMetadata({
    title: page.seo.title,
    description: page.seo.description,
    path: PAGE_PATHS.feature(page.slug),
    noindex: page.preview,
    image: coverShareImage(page.cover, PAGE_PATHS.feature(page.slug), page.hero.title),
  });
}

export default async function Page({ params }: PageProps<"/features/[slug]">) {
  const page = findPage(await getPages("feature"), (await params).slug);
  if (!page) notFound();
  return <FeatureTemplate page={page} />;
}

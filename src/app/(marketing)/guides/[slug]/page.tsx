import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GuideTemplate } from "@/components/marketing/templates/guide-template";
import { getPages } from "@/content/pages";
import { PAGE_PATHS } from "@/content/pages/paths";
import { findPage } from "@/content/pages/schema";
import { marketingMetadata } from "@/lib/seo";

/*
 * Pages from Sanity (studio/) plus the template preview in src/content/pages/guides.ts. Slugs published
 * after the build render on first request and are cached; unknown slugs 404.
 */

export async function generateStaticParams() {
  return (await getPages("guide")).map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }: PageProps<"/guides/[slug]">): Promise<Metadata> {
  const page = findPage(await getPages("guide"), (await params).slug);
  if (!page) return {};
  return marketingMetadata({
    title: page.seo.title,
    description: page.seo.description,
    path: PAGE_PATHS.guide(page.slug),
    type: "article",
    noindex: page.preview,
    ...(page.cover && { image: { url: page.cover.src, width: page.cover.width, height: page.cover.height, alt: page.cover.alt } }),
  });
}

export default async function Page({ params }: PageProps<"/guides/[slug]">) {
  const page = findPage(await getPages("guide"), (await params).slug);
  if (!page) notFound();
  return <GuideTemplate page={page} />;
}

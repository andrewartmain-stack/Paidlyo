import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FeatureTemplate } from "@/components/marketing/templates/feature-template";
import { FEATURE_PAGES } from "@/content/pages/features";
import { PAGE_PATHS } from "@/content/pages/paths";
import { findPage } from "@/content/pages/schema";
import { marketingMetadata } from "@/lib/seo";

/* Static pages from src/content/pages/features.ts. Unknown slugs 404 (dynamicParams isn't available with Cache Components). */

export function generateStaticParams() {
  return FEATURE_PAGES.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }: PageProps<"/features/[slug]">): Promise<Metadata> {
  const page = findPage(FEATURE_PAGES, (await params).slug);
  if (!page) return {};
  return marketingMetadata({
    title: page.seo.title,
    description: page.seo.description,
    path: PAGE_PATHS.feature(page.slug),
    noindex: page.preview,
  });
}

export default async function Page({ params }: PageProps<"/features/[slug]">) {
  const page = findPage(FEATURE_PAGES, (await params).slug);
  if (!page) notFound();
  return <FeatureTemplate page={page} />;
}

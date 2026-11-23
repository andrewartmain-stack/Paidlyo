import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ComparisonTemplate } from "@/components/marketing/templates/comparison-template";
import { COMPARISON_PAGES } from "@/content/pages/comparisons";
import { PAGE_PATHS } from "@/content/pages/paths";
import { findPage } from "@/content/pages/schema";
import { marketingMetadata } from "@/lib/seo";

/* Static pages from src/content/pages/comparisons.ts. Unknown slugs 404 (dynamicParams isn't available with Cache Components). */

export function generateStaticParams() {
  return COMPARISON_PAGES.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }: PageProps<"/compare/[slug]">): Promise<Metadata> {
  const page = findPage(COMPARISON_PAGES, (await params).slug);
  if (!page) return {};
  return marketingMetadata({
    title: page.seo.title,
    description: page.seo.description,
    path: PAGE_PATHS.comparison(page.slug),
    noindex: page.preview,
  });
}

export default async function Page({ params }: PageProps<"/compare/[slug]">) {
  const page = findPage(COMPARISON_PAGES, (await params).slug);
  if (!page) notFound();
  return <ComparisonTemplate page={page} />;
}

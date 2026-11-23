import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AlternativeTemplate } from "@/components/marketing/templates/alternative-template";
import { ALTERNATIVE_PAGES } from "@/content/pages/alternatives";
import { PAGE_PATHS } from "@/content/pages/paths";
import { findPage } from "@/content/pages/schema";
import { marketingMetadata } from "@/lib/seo";

/* Static pages from src/content/pages/alternatives.ts. Unknown slugs 404 (dynamicParams isn't available with Cache Components). */

export function generateStaticParams() {
  return ALTERNATIVE_PAGES.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }: PageProps<"/alternatives/[slug]">): Promise<Metadata> {
  const page = findPage(ALTERNATIVE_PAGES, (await params).slug);
  if (!page) return {};
  return marketingMetadata({
    title: page.seo.title,
    description: page.seo.description,
    path: PAGE_PATHS.alternative(page.slug),
    noindex: page.preview,
  });
}

export default async function Page({ params }: PageProps<"/alternatives/[slug]">) {
  const page = findPage(ALTERNATIVE_PAGES, (await params).slug);
  if (!page) notFound();
  return <AlternativeTemplate page={page} />;
}

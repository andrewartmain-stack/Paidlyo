import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GuideTemplate } from "@/components/marketing/templates/guide-template";
import { GUIDE_PAGES } from "@/content/pages/guides";
import { PAGE_PATHS } from "@/content/pages/paths";
import { findPage } from "@/content/pages/schema";
import { marketingMetadata } from "@/lib/seo";

/* Static pages from src/content/pages/guides.ts. Unknown slugs 404 (dynamicParams isn't available with Cache Components). */

export function generateStaticParams() {
  return GUIDE_PAGES.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }: PageProps<"/guides/[slug]">): Promise<Metadata> {
  const page = findPage(GUIDE_PAGES, (await params).slug);
  if (!page) return {};
  return marketingMetadata({
    title: page.seo.title,
    description: page.seo.description,
    path: PAGE_PATHS.guide(page.slug),
    type: "article",
    noindex: page.preview,
  });
}

export default async function Page({ params }: PageProps<"/guides/[slug]">) {
  const page = findPage(GUIDE_PAGES, (await params).slug);
  if (!page) notFound();
  return <GuideTemplate page={page} />;
}

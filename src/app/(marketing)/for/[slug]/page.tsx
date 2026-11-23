import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AudienceTemplate } from "@/components/marketing/templates/audience-template";
import { AUDIENCE_PAGES } from "@/content/pages/audiences";
import { PAGE_PATHS } from "@/content/pages/paths";
import { findPage } from "@/content/pages/schema";
import { marketingMetadata } from "@/lib/seo";

/* Static pages from src/content/pages/audiences.ts. Unknown slugs 404 (dynamicParams isn't available with Cache Components). */

export function generateStaticParams() {
  return AUDIENCE_PAGES.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }: PageProps<"/for/[slug]">): Promise<Metadata> {
  const page = findPage(AUDIENCE_PAGES, (await params).slug);
  if (!page) return {};
  return marketingMetadata({
    title: page.seo.title,
    description: page.seo.description,
    path: PAGE_PATHS.audience(page.slug),
    noindex: page.preview,
  });
}

export default async function Page({ params }: PageProps<"/for/[slug]">) {
  const page = findPage(AUDIENCE_PAGES, (await params).slug);
  if (!page) notFound();
  return <AudienceTemplate page={page} />;
}

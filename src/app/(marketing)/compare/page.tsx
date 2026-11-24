import type { Metadata } from "next";
import { IndexTemplate } from "@/components/marketing/templates/index-template";
import { INDEX_COPY, indexItems } from "@/content/pages/indexes";
import { INDEX_PATHS } from "@/content/pages/paths";
import { marketingMetadata } from "@/lib/seo";

const COPY = INDEX_COPY.comparison;

/* Lists every published comparison page. Indexed (and in the sitemap and footer) once it has one. */
export async function generateMetadata(): Promise<Metadata> {
  return marketingMetadata({
    title: COPY.seo.title,
    description: COPY.seo.description,
    path: INDEX_PATHS.comparison,
    noindex: (await indexItems("comparison")).length === 0,
  });
}

export default async function Page() {
  return (
    <IndexTemplate
      path={INDEX_PATHS.comparison}
      label={COPY.label}
      title={COPY.title}
      description={COPY.description}
      empty={COPY.empty}
      items={await indexItems("comparison")}
    />
  );
}

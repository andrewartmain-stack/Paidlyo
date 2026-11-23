import { Faq, FinalCta, Steps } from "@/components/marketing/sections";
import { JsonLd } from "@/components/marketing/json-ld";
import type { AlternativePage } from "@/content/pages/schema";
import { PAGE_PATHS } from "@/content/pages/paths";
import { faqJsonLd } from "@/content/structured-data";
import { CardSection, ComparisonTable, PageHero, PreviewBanner, PriceComparison, RelatedLinks } from "./blocks";

/** /alternatives/<slug>: why switch from one competitor, side by side, and how to move. */
export function AlternativeTemplate({ page }: { page: AlternativePage }) {
  return (
    <>
      {page.preview && <PreviewBanner />}
      {page.faq.length > 0 && <JsonLd data={faqJsonLd(page.faq)} />}
      <PageHero
        crumbs={[
          { name: "Home", path: "/" },
          { name: `${page.competitor} alternative`, path: PAGE_PATHS.alternative(page.slug) },
        ]}
        eyebrow={page.hero.eyebrow}
        title={page.hero.title}
        description={page.hero.description}
      />
      <CardSection id="reasons" muted eyebrow={`Why teams leave ${page.competitor}`} title="Reasons to switch" items={page.reasons} />
      <ComparisonTable
        title={`Paidlyo vs ${page.competitor}`}
        columns={[page.competitor, "Paidlyo"]}
        rows={page.comparison.map((row) => ({ feature: row.feature, values: [row.competitor, row.paidlyo] }))}
      />
      <PriceComparison title={`${page.competitor} vs Paidlyo: what your team pays`} tools={[page.pricing]} sizes={page.teamSizes} />
      <Steps id="migration" eyebrow="Switching" title={`Move from ${page.competitor} in minutes`} items={page.migration} />
      {page.faq.length > 0 && <Faq items={page.faq} title={`Switching from ${page.competitor}: questions`} />}
      <RelatedLinks links={page.related} />
      <FinalCta />
    </>
  );
}

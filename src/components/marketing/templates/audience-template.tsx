import { Faq, FinalCta, ScreenshotFrame, SectionHeading, TeamPriceTable } from "@/components/marketing/sections";
import { JsonLd } from "@/components/marketing/json-ld";
import type { AudiencePage } from "@/content/pages/schema";
import { INDEX_COPY } from "@/content/pages/indexes";
import { INDEX_PATHS, PAGE_PATHS } from "@/content/pages/paths";
import { faqJsonLd } from "@/content/structured-data";
import { CardSection, ExampleCard, PageHero, PreviewBanner, RelatedLinks, ScreenshotGallery } from "./blocks";

/** /for/<slug>: landing page for one audience. Section order: problem → example → features → price → proof → FAQ. */
export function AudienceTemplate({ page }: { page: AudiencePage }) {
  const [lead, ...rest] = page.screenshots;
  return (
    <>
      {page.preview && <PreviewBanner />}
      {page.faq.length > 0 && <JsonLd data={faqJsonLd(page.faq)} />}
      <PageHero
        crumbs={[
          { name: "Home", path: "/" },
          { name: INDEX_COPY.audience.label, path: INDEX_PATHS.audience },
          { name: page.name, path: PAGE_PATHS.audience(page.slug) },
        ]}
        eyebrow={page.hero.eyebrow}
        title={page.hero.title}
        description={page.hero.description}
      />
      {lead && (
        <div className="mx-auto -mt-4 max-w-5xl px-4 pb-16 sm:px-6">
          <ScreenshotFrame src={lead.src} alt={lead.alt} width={lead.width} height={lead.height} />
        </div>
      )}
      <CardSection id="problems" muted eyebrow="Why it matters" title={`What slows ${page.name.toLowerCase()} down`} items={page.painPoints} />
      <ExampleCard {...page.example} />
      <CardSection id="features" muted eyebrow="Features" title={`Built for how ${page.name.toLowerCase()} work`} items={page.features} />
      <section aria-labelledby="team-price-title" className="py-20 sm:py-24">
        <div className="mx-auto flex max-w-3xl flex-col gap-10 px-4 sm:px-6">
          <SectionHeading
            id="team-price-title"
            eyebrow="Pricing"
            title="What Paidlyo costs your team"
            description="One plan with every feature, priced per person."
          />
          <TeamPriceTable sizes={page.teamSizes} />
        </div>
      </section>
      <ScreenshotGallery title={`Paidlyo for ${page.name.toLowerCase()}`} items={rest} />
      {page.faq.length > 0 && <Faq items={page.faq} title={`Questions from ${page.name.toLowerCase()}`} />}
      <RelatedLinks links={page.related} />
      <FinalCta />
    </>
  );
}

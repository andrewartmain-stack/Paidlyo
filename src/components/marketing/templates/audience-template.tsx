import { Faq, FinalCta, ScreenshotFrame, SectionHeading, TeamPriceTable } from "@/components/marketing/sections";
import { JsonLd } from "@/components/marketing/json-ld";
import type { AudiencePage } from "@/content/pages/schema";
import { PRODUCT_NAMES } from "@/content/pages/paths";
import { faqJsonLd } from "@/content/structured-data";
import { CardSection, ExampleCard, LinkGrid, PageHero, PreviewBanner, RelatedLinks, ScreenshotGallery, SectionRows, type Crumb } from "./blocks";

/**
 * /{product}/for/<slug>: one product for one audience. Section order: problem → example →
 * optional text sections → features → price → proof → FAQ → the product's other pages.
 */
export function AudienceTemplate({
  page,
  crumbs,
  siblings,
}: {
  page: AudiencePage;
  crumbs: Crumb[];
  siblings: { href: string; title: string; text: string }[];
}) {
  const [lead, ...rest] = page.screenshots;
  return (
    <>
      {page.preview && <PreviewBanner />}
      {page.faq.length > 0 && <JsonLd data={faqJsonLd(page.faq)} />}
      <PageHero
        crumbs={crumbs}
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
      <SectionRows sections={page.sections} />
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
      <LinkGrid id="more" eyebrow="More" title={`More about ${PRODUCT_NAMES[page.product].toLowerCase()} in Paidlyo`} links={siblings} muted />
      <RelatedLinks links={page.related} />
      <FinalCta />
    </>
  );
}

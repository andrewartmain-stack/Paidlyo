import { Faq, FinalCta, ScreenshotFrame, SectionHeading, TeamPriceTable } from "@/components/marketing/sections";
import { JsonLd } from "@/components/marketing/json-ld";
import type { ProductPage, VariantPage } from "@/content/pages/schema";
import { faqJsonLd } from "@/content/structured-data";
import { CardSection, LinkGrid, PageHero, PreviewBanner, ScreenshotGallery, SectionRows, type Crumb, type LinkCard, richFaq } from "./blocks";

export type LinkGroup = { id: string; eyebrow?: string; title: string; links: LinkCard[] };

/**
 * Product (/invoicing) and variant (/invoicing/free) pages. Order: hero → screenshot → sections →
 * features → links into the product's other pages → price → screenshots → FAQ.
 */
export function LandingTemplate({ page, crumbs, linkGroups }: { page: ProductPage | VariantPage; crumbs: Crumb[]; linkGroups: LinkGroup[] }) {
  const [lead, ...rest] = page.screenshots;
  return (
    <>
      {page.preview && <PreviewBanner />}
      {page.faq.length > 0 && <JsonLd data={faqJsonLd(page.faq)} />}
      <PageHero crumbs={crumbs} eyebrow={page.hero.eyebrow} title={page.hero.title} description={page.hero.description}
        updated={page.updated} />
      {lead && (
        <div className="mx-auto -mt-4 max-w-5xl px-4 pb-16 sm:px-6">
          <ScreenshotFrame src={lead.src} alt={lead.alt} width={lead.width} height={lead.height} />
        </div>
      )}
      <SectionRows sections={page.sections} />
      {page.highlights.length > 0 && <CardSection id="highlights" muted eyebrow="Features" title="Everything included" items={page.highlights} />}
      {linkGroups.map((group, i) => (
        <LinkGrid key={group.id} {...group} muted={i % 2 === (page.highlights.length > 0 ? 1 : 0)} />
      ))}
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
      <ScreenshotGallery title="See it in Paidlyo" items={rest} />
      {page.faq.length > 0 && <Faq items={richFaq(page.faq)} />}
      <FinalCta />
    </>
  );
}

import { Faq, FinalCta, Steps } from "@/components/marketing/sections";
import { JsonLd } from "@/components/marketing/json-ld";
import type { FeaturePage } from "@/content/pages/schema";
import { PAGE_PATHS } from "@/content/pages/paths";
import { faqJsonLd } from "@/content/structured-data";
import { CardSection, PageHero, PreviewBanner, ScreenshotGallery, richFaq, SectionRows } from "./blocks";

/** /features/<slug>: one capability, shown and explained step by step. */
export function FeatureTemplate({ page }: { page: FeaturePage }) {
  return (
    <>
      {page.preview && <PreviewBanner />}
      {page.faq.length > 0 && <JsonLd data={faqJsonLd(page.faq)} />}
      <PageHero
        crumbs={[
          { name: "Home", path: "/" },
          { name: "Features", path: "/features" },
          { name: page.name, path: PAGE_PATHS.feature(page.slug) },
        ]}
        eyebrow={page.hero.eyebrow}
        title={page.hero.title}
        description={page.hero.description}
        updated={page.updated}
      />
      <ScreenshotGallery title={`${page.name} in Paidlyo`} items={page.screenshots} />
      <Steps id="how-it-works" eyebrow="How it works" title={`How ${page.name.toLowerCase()} works`} items={page.steps} />
      <CardSection id="benefits" muted eyebrow="Why it helps" title="What you get" items={page.benefits} />
      <SectionRows sections={page.sections} />
      {page.faq.length > 0 && <Faq items={richFaq(page.faq)} title={`${page.name}: questions`} />}
      <FinalCta />
    </>
  );
}

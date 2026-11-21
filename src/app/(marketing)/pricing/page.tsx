import type { Metadata } from "next";
import { JsonLd } from "@/components/marketing/json-ld";
import { PricingPlan } from "@/components/marketing/pricing-plan";
import { Faq, FinalCta } from "@/components/marketing/sections";
import { PRICING_FAQ, PRICING_HERO, PRICING_META } from "@/content/pricing";
import { faqJsonLd, softwareApplicationJsonLd } from "@/content/structured-data";
import { marketingMetadata } from "@/lib/seo";

export const metadata: Metadata = marketingMetadata({
  title: PRICING_META.title,
  description: PRICING_META.description,
  path: "/pricing",
});

export default function PricingPage() {
  return (
    <>
      <JsonLd data={softwareApplicationJsonLd()} />
      <JsonLd data={faqJsonLd(PRICING_FAQ)} />
      <section aria-labelledby="pricing-title" className="px-4 pt-16 pb-20 sm:px-6 sm:pt-24 sm:pb-28">
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 pb-12 text-center">
          <p className="rounded-full bg-accent px-3 py-1 text-sm font-medium text-accent-foreground">
            {PRICING_HERO.eyebrow}
          </p>
          <h1 id="pricing-title" className="text-4xl leading-tight sm:text-5xl">
            {PRICING_HERO.title}
          </h1>
          <p className="text-lg text-muted-foreground">{PRICING_HERO.description}</p>
        </div>
        <PricingPlan />
      </section>
      <Faq items={PRICING_FAQ} title="Pricing questions" />
      <FinalCta />
    </>
  );
}

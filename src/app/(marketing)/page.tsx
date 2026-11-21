import type { Metadata } from "next";
import { JsonLd } from "@/components/marketing/json-ld";
import { Faq, FeatureGrid, FinalCta, Hero, Steps, SwitchFromHarvest } from "@/components/marketing/sections";
import { SITE } from "@/content/landing";
import { faqJsonLd, softwareApplicationJsonLd } from "@/content/structured-data";
import { marketingMetadata } from "@/lib/seo";

const TITLE = "Time Tracking & Invoicing for Freelancers | Paidlyo";

export const metadata: Metadata = marketingMetadata({ title: TITLE, description: SITE.description, path: "/" });

export default function HomePage() {
  return (
    <>
      <JsonLd data={softwareApplicationJsonLd()} />
      <JsonLd data={faqJsonLd()} />
      <Hero />
      <FeatureGrid />
      <Steps />
      <SwitchFromHarvest />
      <Faq />
      <FinalCta />
    </>
  );
}

import type { Metadata } from "next";
import { JsonLd } from "@/components/marketing/json-ld";
import {
  Audiences,
  Faq,
  FinalCta,
  Hero,
  PricingSummary,
  Steps,
  SwitchFromHarvest,
  Trust,
} from "@/components/marketing/sections";
import { FeatureBento } from "@/components/marketing/feature-bento";
import { ProductTabs } from "@/components/marketing/product-tabs";
import { Workflows } from "@/components/marketing/workflows";
import { SITE } from "@/content/landing";
import { faqJsonLd, softwareApplicationJsonLd } from "@/content/structured-data";
import { marketingMetadata } from "@/lib/seo";

const TITLE = "Time Tracking & Invoicing Software | Paidlyo";

export const metadata: Metadata = marketingMetadata({ title: TITLE, description: SITE.description, path: "/" });

export default function HomePage() {
  return (
    <>
      <JsonLd data={softwareApplicationJsonLd()} />
      <JsonLd data={faqJsonLd()} />
      <Hero />
      <Workflows />
      <ProductTabs />
      <FeatureBento />
      <Audiences />
      <Steps />
      <SwitchFromHarvest />
      <PricingSummary />
      <Trust />
      <Faq />
      <FinalCta />
    </>
  );
}

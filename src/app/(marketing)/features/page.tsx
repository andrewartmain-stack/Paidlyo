import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { FeatureGrid, FinalCta, ProductTour } from "@/components/marketing/sections";
import { PageHero } from "@/components/marketing/templates/blocks";
import { FEATURE_PAGES } from "@/content/pages/features";
import { PAGE_PATHS } from "@/content/pages/paths";
import { published } from "@/content/pages/schema";
import { marketingMetadata } from "@/lib/seo";

const FEATURES = published(FEATURE_PAGES);

/* Indexed (and in the sitemap) only once at least one real feature page exists. */
export const metadata: Metadata = marketingMetadata({
  title: "Time Tracking & Invoicing Features | Paidlyo",
  description:
    "Every Paidlyo feature: timesheets and timer, invoices from tracked time, project budgets, timesheet approvals, team rates, payment tracking and reports.",
  path: "/features",
  noindex: FEATURES.length === 0,
});

export default function FeaturesPage() {
  return (
    <>
      <PageHero
        crumbs={[
          { name: "Home", path: "/" },
          { name: "Features", path: "/features" },
        ]}
        eyebrow="Features"
        title="Time tracking and invoicing features"
        description="Everything Paidlyo does to turn your team's hours into paid invoices, included in one plan."
      />
      {FEATURES.length > 0 ? (
        <section aria-label="Feature pages" className="px-4 pb-20 sm:px-6">
          <ul className="mx-auto grid max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <li key={feature.slug} className="flex flex-col gap-3 rounded-2xl border bg-card p-6">
                <h2 className="text-lg">{feature.name}</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">{feature.summary}</p>
                <Link
                  href={PAGE_PATHS.feature(feature.slug)}
                  className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline"
                >
                  {feature.name} in detail
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <>
          <ProductTour />
          <FeatureGrid />
        </>
      )}
      <FinalCta />
    </>
  );
}

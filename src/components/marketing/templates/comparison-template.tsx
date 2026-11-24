import { Faq, FinalCta } from "@/components/marketing/sections";
import { JsonLd } from "@/components/marketing/json-ld";
import type { ComparisonPage } from "@/content/pages/schema";
import { INDEX_COPY } from "@/content/pages/indexes";
import { INDEX_PATHS, PAGE_PATHS } from "@/content/pages/paths";
import { faqJsonLd } from "@/content/structured-data";
import { ComparisonTable, PageHero, PreviewBanner, PriceComparison, RelatedLinks } from "./blocks";

/** /compare/<slug>: "X vs Y" or one tool's pricing, with Paidlyo as the last column. */
export function ComparisonTemplate({ page }: { page: ComparisonPage }) {
  const names = page.tools.map((tool) => tool.name);
  return (
    <>
      {page.preview && <PreviewBanner />}
      {page.faq.length > 0 && <JsonLd data={faqJsonLd(page.faq)} />}
      <PageHero
        crumbs={[
          { name: "Home", path: "/" },
          { name: INDEX_COPY.comparison.label, path: INDEX_PATHS.comparison },
          { name: page.hero.title, path: PAGE_PATHS.comparison(page.slug) },
        ]}
        eyebrow={page.hero.eyebrow}
        title={page.hero.title}
        description={page.hero.description}
      />
      <section aria-labelledby="verdict-title" className="px-4 pb-16 sm:px-6">
        <div className="mx-auto flex max-w-4xl flex-col gap-6 rounded-2xl border bg-card p-6 sm:p-10">
          <h2 id="verdict-title" className="text-2xl sm:text-3xl">
            The short answer
          </h2>
          <p className="text-lg text-muted-foreground">{page.verdict.summary}</p>
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {page.verdict.bestFor.map((item) => (
              <div key={item.tool} className="flex flex-col gap-1 rounded-xl bg-muted/60 p-4">
                <dt className="font-semibold">Best for: {item.tool}</dt>
                <dd className="text-sm text-muted-foreground">{item.text}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
      <ComparisonTable title="Feature by feature" columns={[...names, "Paidlyo"]} rows={page.rows} />
      <PriceComparison
        title={page.kind === "pricing" ? `${names[0]} pricing for your team size` : `${names.join(" vs ")}: what your team pays`}
        tools={page.tools}
        sizes={page.teamSizes}
      />
      {page.sections.length > 0 && (
        <article className="px-4 py-20 sm:px-6 sm:py-24">
          <div className="mx-auto flex max-w-3xl flex-col gap-10">
            {page.sections.map((section) => (
              <section key={section.heading} className="flex flex-col gap-4">
                <h2 className="text-2xl sm:text-3xl">{section.heading}</h2>
                {section.paragraphs.map((paragraph, i) => (
                  <p key={i} className="text-lg leading-relaxed text-muted-foreground">
                    {paragraph}
                  </p>
                ))}
              </section>
            ))}
          </div>
        </article>
      )}
      {page.faq.length > 0 && <Faq items={page.faq} />}
      <RelatedLinks links={page.related} />
      <FinalCta />
    </>
  );
}

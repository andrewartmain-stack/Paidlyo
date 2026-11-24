import Image from "next/image";
import { Faq, FinalCta } from "@/components/marketing/sections";
import { JsonLd } from "@/components/marketing/json-ld";
import type { GuidePage, Screenshot } from "@/content/pages/schema";
import { INDEX_COPY } from "@/content/pages/indexes";
import { INDEX_PATHS, PAGE_PATHS } from "@/content/pages/paths";
import { articleJsonLd, faqJsonLd } from "@/content/structured-data";
import { Breadcrumbs, PreviewBanner, RelatedLinks } from "./blocks";

const dateFormat = new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeZone: "UTC" });
const formatDate = (iso: string) => dateFormat.format(new Date(`${iso}T00:00:00Z`));

/** An image inside the article column, with an optional caption. */
function ArticleImage({ image, priority = false }: { image: Screenshot; priority?: boolean }) {
  return (
    <figure className="flex flex-col gap-2">
      <Image
        src={image.src}
        alt={image.alt}
        width={image.width}
        height={image.height}
        sizes="(min-width: 768px) 768px, 100vw"
        priority={priority}
        className="h-auto w-full rounded-2xl border bg-muted"
      />
      {image.caption && <figcaption className="text-center text-sm text-muted-foreground">{image.caption}</figcaption>}
    </figure>
  );
}

/** /guides/<slug>: an article with a table of contents, BlogPosting JSON-LD and links into the product. */
export function GuideTemplate({ page }: { page: GuidePage }) {
  const path = PAGE_PATHS.guide(page.slug);
  return (
    <>
      {page.preview && <PreviewBanner />}
      <JsonLd
        data={articleJsonLd({
          title: page.title,
          description: page.description,
          path,
          author: page.author,
          published: page.published,
          updated: page.updated,
          image: page.cover?.src,
        })}
      />
      {page.faq.length > 0 && <JsonLd data={faqJsonLd(page.faq)} />}
      <article className="px-4 pt-10 pb-20 sm:px-6 sm:pt-14">
        <div className="mx-auto flex max-w-3xl flex-col gap-10">
          <Breadcrumbs
            items={[
              { name: "Home", path: "/" },
              { name: INDEX_COPY.guide.label, path: INDEX_PATHS.guide },
              { name: page.title, path },
            ]}
          />
          <header className="flex flex-col gap-5">
            <h1 className="text-4xl leading-tight sm:text-5xl">{page.title}</h1>
            <p className="text-xl text-muted-foreground">{page.description}</p>
            <p className="text-sm text-muted-foreground">
              By {page.author} · Updated <time dateTime={page.updated}>{formatDate(page.updated)}</time>
            </p>
          </header>
          {page.cover && <ArticleImage image={page.cover} priority />}
          {page.sections.length > 1 && (
            <nav aria-labelledby="toc-title" className="rounded-2xl border bg-card p-6">
              <h2 id="toc-title" className="text-base font-semibold">
                In this guide
              </h2>
              <ol className="mt-3 flex list-decimal flex-col gap-2 pl-5 text-sm">
                {page.sections.map((section) => (
                  <li key={section.id}>
                    <a href={`#${section.id}`} className="text-brand hover:underline">
                      {section.heading}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          )}
          {page.sections.map((section) => (
            <section key={section.id} aria-labelledby={section.id} className="flex scroll-mt-20 flex-col gap-4">
              <h2 id={section.id} className="text-2xl sm:text-3xl">
                {section.heading}
              </h2>
              {section.paragraphs.map((paragraph, i) => (
                <p key={i} className="text-lg leading-relaxed">
                  {paragraph}
                </p>
              ))}
              {section.bullets.length > 0 && (
                <ul className="flex list-disc flex-col gap-2 pl-6 text-lg">
                  {section.bullets.map((bullet, i) => (
                    <li key={`${i}-${bullet}`}>{bullet}</li>
                  ))}
                </ul>
              )}
              {section.image && <ArticleImage image={section.image} />}
            </section>
          ))}
        </div>
      </article>
      {page.faq.length > 0 && <Faq items={page.faq} />}
      <RelatedLinks links={page.related} />
      <FinalCta />
    </>
  );
}

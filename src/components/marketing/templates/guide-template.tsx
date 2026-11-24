import Image from "next/image";
import { Faq, FinalCta } from "@/components/marketing/sections";
import { JsonLd } from "@/components/marketing/json-ld";
import type { GuidePage, Screenshot } from "@/content/pages/schema";
import { INDEX_COPY } from "@/content/pages/indexes";
import { INDEX_PATHS, PAGE_PATHS } from "@/content/pages/paths";
import { articleJsonLd, faqJsonLd } from "@/content/structured-data";
import { AUTHOR } from "@/content/author";
import { ArticleSidebar, AuthorBox, Breadcrumbs, Byline, Callout, LONG_FORM_MIN_SECTIONS, MobileToc, PreviewBanner, RelatedLinks } from "./blocks";

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

/**
 * /guides/<slug>: an article with BlogPosting JSON-LD and links into the product. From three
 * sections on, the contents, author and trial offer sit in a sticky sidebar on desktop.
 */
export function GuideTemplate({ page }: { page: GuidePage }) {
  const path = PAGE_PATHS.guide(page.slug);
  const toc = page.sections.map((section) => ({ id: section.id, heading: section.heading }));
  const withSidebar = page.sections.length >= LONG_FORM_MIN_SECTIONS;
  const byAuthor = page.author === AUTHOR.name;
  return (
    <>
      {page.preview && <PreviewBanner />}
      <JsonLd
        data={articleJsonLd({
          title: page.title,
          description: page.description,
          path,
          author: page.author,
          ...(byAuthor && { authorImage: AUTHOR.avatar.src, authorRole: AUTHOR.role }),
          published: page.published,
          updated: page.updated,
          image: page.cover?.src,
        })}
      />
      {page.faq.length > 0 && <JsonLd data={faqJsonLd(page.faq)} />}
      <article className="px-4 pt-10 pb-20 sm:px-6 sm:pt-14">
        <div className={`mx-auto grid gap-12 ${withSidebar ? "max-w-6xl lg:grid-cols-[minmax(0,1fr)_18rem]" : "max-w-3xl"}`}>
          <div className="mx-auto flex w-full max-w-3xl min-w-0 flex-col gap-10">
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
              <Byline updated={page.updated} author={page.author} />
            </header>
            {page.cover && <ArticleImage image={page.cover} priority />}
            {page.sections.length > 1 && <MobileToc items={toc} className={withSidebar ? "lg:hidden" : ""} />}
            {page.sections.map((section) => (
              <section key={section.id} aria-labelledby={section.id} className="flex scroll-mt-28 flex-col gap-4">
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
                {section.callout && <Callout text={section.callout} />}
                {section.image && <ArticleImage image={section.image} />}
              </section>
            ))}
            {byAuthor && <AuthorBox className={withSidebar ? "lg:hidden" : ""} />}
          </div>
          {withSidebar && <ArticleSidebar items={toc} />}
        </div>
      </article>
      {page.faq.length > 0 && <Faq items={page.faq} />}
      <RelatedLinks links={page.related} />
      <FinalCta />
    </>
  );
}

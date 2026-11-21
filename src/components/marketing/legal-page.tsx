import { formatDate } from "@/features/time/dates";
import type { LegalDocument } from "@/content/legal";
import { LEGAL_UPDATED } from "@/content/legal";

/** Layout for the Terms and Privacy pages: one h1, numbered h2 sections. */
export function LegalPage({ doc }: { doc: LegalDocument }) {
  return (
    <article className="mx-auto flex max-w-3xl flex-col gap-10 px-4 py-16 sm:px-6 sm:py-24">
      <header className="flex flex-col gap-3">
        <h1 className="text-4xl sm:text-5xl">{doc.title}</h1>
        <p className="text-sm text-muted-foreground">
          Last updated <time dateTime={LEGAL_UPDATED}>{formatDate(LEGAL_UPDATED)}</time>
        </p>
        <p className="text-lg text-muted-foreground">{doc.intro}</p>
      </header>
      {doc.sections.map((section) => (
        <section key={section.heading} className="flex flex-col gap-3">
          <h2 className="text-xl">{section.heading}</h2>
          {section.paragraphs.map((paragraph) => (
            <p key={paragraph} className="leading-relaxed text-muted-foreground">
              {paragraph}
            </p>
          ))}
          {section.items && (
            <ul className="flex list-disc flex-col gap-2 pl-5 leading-relaxed text-muted-foreground">
              {section.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </article>
  );
}

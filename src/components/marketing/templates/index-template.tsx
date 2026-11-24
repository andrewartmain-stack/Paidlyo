import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { FinalCta } from "@/components/marketing/sections";
import type { IndexItem } from "@/content/pages/indexes";
import { PageHero } from "./blocks";

/** An index page (/guides, /alternatives, /compare): one card per published page. */
export function IndexTemplate({
  path,
  label,
  title,
  description,
  empty,
  items,
}: {
  path: string;
  label: string;
  title: string;
  description: string;
  empty: string;
  items: IndexItem[];
}) {
  return (
    <>
      <PageHero
        crumbs={[
          { name: "Home", path: "/" },
          { name: label, path },
        ]}
        eyebrow={label}
        title={title}
        description={description}
        showCta={false}
      />
      <section aria-label={label} className="px-4 pb-20 sm:px-6">
        {items.length > 0 ? (
          <ul className="mx-auto grid max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <li key={item.href} className="flex flex-col gap-3 rounded-2xl border bg-card p-6">
                <h2 className="text-lg">{item.title}</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">{item.text}</p>
                <Link href={item.href} className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline">
                  {item.linkLabel}
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mx-auto max-w-6xl text-center text-muted-foreground">{empty}</p>
        )}
      </section>
      <FinalCta />
    </>
  );
}

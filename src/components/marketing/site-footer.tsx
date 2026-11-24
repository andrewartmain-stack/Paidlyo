import Link from "next/link";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/app-shell/logo";
import { LEGAL_ENTITY } from "@/content/legal";
import { LEGAL_LINKS, NAV_LINKS, SITE } from "@/content/landing";
import { liveIndexes } from "@/content/pages/indexes";

const ACCOUNT_LINKS = [
  { href: "/signup", label: "Create an account" },
  { href: "/login", label: "Log in" },
];

function FooterColumn({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold">{title}</h2>
      <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="hover:text-foreground">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Static (CMS data is cached); index pages appear in "Resources" once they have a page. */
export async function SiteFooter() {
  const resources = (await liveIndexes()).map((index) => ({ href: index.path, label: index.label }));
  return (
    <footer className="border-t">
      <div
        className={cn(
          "mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 sm:grid-cols-3",
          resources.length > 0 ? "md:grid-cols-[2fr_1fr_1fr_1fr_1fr]" : "md:grid-cols-[2fr_1fr_1fr_1fr]",
        )}
      >
        <div className="flex flex-col items-start gap-3 sm:col-span-3 md:col-span-1">
          <Logo href="/" animated />
          <p className="max-w-xs text-sm text-muted-foreground">{SITE.tagline}.</p>
        </div>
        <FooterColumn title="Product" links={NAV_LINKS} />
        {resources.length > 0 && <FooterColumn title="Resources" links={resources} />}
        <FooterColumn title="Account" links={ACCOUNT_LINKS} />
        <FooterColumn title="Legal" links={LEGAL_LINKS} />
      </div>
      <div className="border-t">
        <p className="mx-auto max-w-6xl px-4 py-6 text-xs text-muted-foreground sm:px-6">
          © {SITE.name} · Operated by {LEGAL_ENTITY.name}, {LEGAL_ENTITY.country} ·{" "}
          <a href={`mailto:${LEGAL_ENTITY.email}`} className="hover:text-foreground">
            {LEGAL_ENTITY.email}
          </a>
        </p>
      </div>
    </footer>
  );
}

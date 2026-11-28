import Link from "next/link";
import { Logo } from "@/components/app-shell/logo";
import { LEGAL_LINKS, NAV_LINKS, SITE } from "@/content/landing";
import { siteDirectory } from "@/content/pages/cards";

const ACCOUNT_LINKS = [
  { href: "/signup", label: "Create an account" },
  { href: "/login", label: "Log in" },
];

type FooterLink = { href: string; label: string };

function FooterColumn({ title, links, all }: { title: string; links: FooterLink[]; all?: FooterLink }) {
  return (
    <div className="flex min-w-0 flex-col gap-3">
      <h2 className="text-sm font-semibold">{title}</h2>
      <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="hover:text-foreground">
              {link.label}
            </Link>
          </li>
        ))}
        {all && (
          <li>
            <Link href={all.href} className="font-medium text-brand hover:underline">
              {all.label}
            </Link>
          </li>
        )}
      </ul>
    </div>
  );
}

/**
 * Static (CMS data is cached). Lists every published page by section, up to DIRECTORY_LIMIT each,
 * with a link to the section's overview page for the rest.
 */
export async function SiteFooter() {
  const sections = (await siteDirectory()).flatMap((group) => group.sections);
  return (
    <footer className="border-t">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_3fr]">
        <div className="flex flex-col items-start gap-3">
          <Logo href="/" animated />
          <p className="max-w-xs text-sm text-muted-foreground">{SITE.tagline}.</p>
        </div>
        <div className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-3 md:grid-cols-4">
          {sections.map((section) => (
            <FooterColumn key={section.title} title={section.title} links={section.links} all={section.all} />
          ))}
          <FooterColumn title={SITE.name} links={NAV_LINKS} />
          <FooterColumn title="Account" links={ACCOUNT_LINKS} />
          <FooterColumn title="Legal" links={LEGAL_LINKS} />
        </div>
      </div>
      <div className="border-t">
        <p className="mx-auto max-w-6xl px-4 py-6 text-xs text-muted-foreground sm:px-6">© {SITE.name}</p>
      </div>
    </footer>
  );
}

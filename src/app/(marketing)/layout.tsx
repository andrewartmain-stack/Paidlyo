import { JsonLd } from "@/components/marketing/json-ld";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { organizationJsonLd, websiteJsonLd } from "@/content/structured-data";

/*
 * Every marketing page must be fully static (build-validated). It also makes the first visit to
 * an unknown URL wait for the finished page, so it gets a real 404 status instead of a 200 shell.
 */
export const ensureStatic = "navigation";

/** Public, indexed marketing pages (static: never read the session here). */
export default function MarketingLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <JsonLd data={organizationJsonLd()} />
      <JsonLd data={websiteJsonLd()} />
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}

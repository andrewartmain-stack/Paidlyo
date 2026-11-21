import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/legal-page";
import { TERMS } from "@/content/legal";
import { marketingMetadata } from "@/lib/seo";

export const metadata: Metadata = marketingMetadata({
  title: TERMS.metaTitle,
  description: TERMS.metaDescription,
  path: TERMS.path,
});

export default function TermsPage() {
  return <LegalPage doc={TERMS} />;
}

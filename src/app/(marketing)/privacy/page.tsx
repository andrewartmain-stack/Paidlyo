import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/legal-page";
import { PRIVACY } from "@/content/legal";
import { marketingMetadata } from "@/lib/seo";

export const metadata: Metadata = marketingMetadata({
  title: PRIVACY.metaTitle,
  description: PRIVACY.metaDescription,
  path: PRIVACY.path,
});

export default function PrivacyPage() {
  return <LegalPage doc={PRIVACY} />;
}

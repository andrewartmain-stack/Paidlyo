import { absoluteUrl } from "@/lib/site-url";
import { FAQ, SITE, type FaqItem } from "./landing";
import { PLAN } from "./pricing";

/* JSON-LD (schema.org). Values must match what the page shows. */

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE.name,
    url: absoluteUrl("/"),
    logo: absoluteUrl("/logo.png"),
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE.name,
    url: absoluteUrl("/"),
  };
}

export function softwareApplicationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: SITE.name,
    url: absoluteUrl("/"),
    description: SITE.description,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: [
      { "@type": "Offer", name: "Monthly", price: (PLAN.monthlyCents / 100).toFixed(2), priceCurrency: PLAN.currency, url: absoluteUrl("/pricing") },
      { "@type": "Offer", name: "Yearly", price: (PLAN.yearlyCents / 100).toFixed(2), priceCurrency: PLAN.currency, url: absoluteUrl("/pricing") },
    ],
  };
}

export function faqJsonLd(items: FaqItem[] = FAQ) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}

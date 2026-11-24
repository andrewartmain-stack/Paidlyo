import { absoluteUrl } from "@/lib/site-url";
import { FAQ, FEATURES, SITE, TOUR, type FaqItem } from "./landing";
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
    featureList: [...TOUR.map((item) => item.title), ...FEATURES.map((feature) => feature.title)],
    screenshot: absoluteUrl("/videos/paidlyo-demo-poster.jpg"),
    offers: [
      { "@type": "Offer", name: "Monthly, per person", price: (PLAN.monthlyCents / 100).toFixed(2), priceCurrency: PLAN.currency, url: absoluteUrl("/pricing") },
      { "@type": "Offer", name: "Yearly, per person", price: (PLAN.yearlyCents / 100).toFixed(2), priceCurrency: PLAN.currency, url: absoluteUrl("/pricing") },
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

/** Breadcrumb trail for a page; the last item is the page itself. */
export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

/** BlogPosting for a guide. Dates are ISO (YYYY-MM-DD). */
export function articleJsonLd(article: {
  title: string;
  description: string;
  path: string;
  author: string;
  published: string;
  updated: string;
  /** Cover image: an absolute URL or a site path. */
  image?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: article.title,
    description: article.description,
    url: absoluteUrl(article.path),
    mainEntityOfPage: absoluteUrl(article.path),
    datePublished: article.published,
    dateModified: article.updated,
    ...(article.image && { image: article.image.startsWith("/") ? absoluteUrl(article.image) : article.image }),
    author: { "@type": "Person", name: article.author },
    publisher: { "@type": "Organization", name: SITE.name, logo: { "@type": "ImageObject", url: absoluteUrl("/logo.png") } },
  };
}

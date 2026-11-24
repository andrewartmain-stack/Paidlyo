import type { z } from "zod";
import { PAGE_TYPES, pagePath, PREVIEW_SLUG, type PageType } from "./paths";
import {
  alternativeSchema,
  audienceSchema,
  comparisonSchema,
  featurePageSchema,
  guideSchema,
  productPageSchema,
  variantPageSchema,
  type AlternativePage,
  type AudiencePage,
  type ComparisonPage,
  type FeaturePage,
  type GuidePage,
  type ProductPage,
  type VariantPage,
} from "./schema";

/*
 * Pages edited in Sanity (studio/) are read with GROQ, turned back into the shapes in schema.ts
 * and validated with the same Zod schemas as the code collections. A document that fails
 * validation is skipped (and logged) instead of rendering a broken page.
 */

export { PAGE_TYPES, type PageType };

export type PageByType = {
  product: ProductPage;
  variant: VariantPage;
  audience: AudiencePage;
  alternative: AlternativePage;
  comparison: ComparisonPage;
  feature: FeaturePage;
  guide: GuidePage;
};

export const PAGE_SCHEMAS: { [K in PageType]: z.ZodType<PageByType[K]> } = {
  product: productPageSchema,
  variant: variantPageSchema,
  audience: audienceSchema,
  alternative: alternativeSchema,
  comparison: comparisonSchema,
  feature: featurePageSchema,
  guide: guideSchema,
};

/** Sanity document type of each page type (`productPage`, `variantPage`, …); must match studio/schemaTypes. */
export const cmsDocType = (type: PageType) => `${type}Page`;

export function pageTypeFromDocType(docType: string): PageType | undefined {
  return PAGE_TYPES.find((type) => cmsDocType(type) === docType);
}

/** Cache tag of one page type's documents; the Sanity webhook revalidates it on publish. */
export const cmsTag = (type: PageType) => `cms:${type}`;

/* GROQ: images become { src, width, height, alt, caption }; missing dates fall back to Sanity's. */
const IMAGE = `{ "src": asset->url, "width": asset->metadata.dimensions.width, "height": asset->metadata.dimensions.height, alt, caption }`;
/* Every page type: cover, sections (with images) and screenshots; fields a type lacks come back null and are dropped. */
const COMMON = `..., "slug": slug.current, "updated": coalesce(updated, string::split(_updatedAt, "T")[0]), cover${IMAGE}, sections[]{..., image${IMAGE}}, screenshots[]${IMAGE}`;
const PROJECTIONS: Record<PageType, string> = {
  // A product page has no slug field: its slug is the product.
  product: `${COMMON}, "slug": product`,
  variant: COMMON,
  audience: COMMON,
  alternative: COMMON,
  comparison: COMMON,
  feature: COMMON,
  guide: `${COMMON}, "published": coalesce(published, string::split(_createdAt, "T")[0])`,
};

/** Published documents of one type (pass `{ docType: cmsDocType(type) }` as params). */
export function pagesQuery(type: PageType): string {
  const identified = type === "product" ? "defined(product)" : "defined(slug.current)";
  return `*[_type == $docType && ${identified}] | order(_createdAt asc) { ${PROJECTIONS[type]} }`;
}

/** GROQ returns null for empty fields; Zod's optional fields expect them to be absent. */
export function stripNulls(value: unknown): unknown {
  if (Array.isArray(value)) return value.filter((item) => item !== null).map(stripNulls);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, item]) => item !== null)
        .map(([key, item]) => [key, stripNulls(item)]),
    );
  }
  return value;
}

/** Comparison cells are typed as text in Sanity and the CSV: "yes" / "no" become a check / cross. */
export function toCell(value: unknown): unknown {
  if (typeof value !== "string") return value;
  const normalized = value.trim().toLowerCase();
  if (normalized === "yes") return true;
  if (normalized === "no") return false;
  return value;
}

type Doc = Record<string, unknown>;

function mapArray(value: unknown, fn: (item: Doc) => Doc): unknown {
  return Array.isArray(value) ? value.map((item) => (item && typeof item === "object" ? fn(item as Doc) : item)) : value;
}

/** A Sanity document (after the GROQ projection) in the shape the Zod schema expects. */
export function fromCms(type: PageType, doc: unknown): unknown {
  const clean = stripNulls(doc);
  if (!clean || typeof clean !== "object" || Array.isArray(clean)) return clean;
  const page: Doc = { ...(clean as Doc), preview: false };
  if (type === "alternative") {
    page.comparison = mapArray(page.comparison, (row) => ({ ...row, paidlyo: toCell(row.paidlyo), competitor: toCell(row.competitor) }));
  }
  if (type === "comparison") {
    page.rows = mapArray(page.rows, (row) => ({ ...row, values: Array.isArray(row.values) ? row.values.map(toCell) : row.values }));
  }
  return page;
}

export type CmsError = { slug: string; message: string };

/** Validate fetched documents: valid ones become pages, the rest are reported. */
export function parseCmsPages<T extends PageType>(type: T, docs: unknown[]): { pages: PageByType[T][]; errors: CmsError[] } {
  const pages: PageByType[T][] = [];
  const errors: CmsError[] = [];
  const seen = new Set<string>();
  for (const doc of docs) {
    const slug = doc && typeof doc === "object" && "slug" in doc && typeof doc.slug === "string" ? doc.slug : "(no slug)";
    if (slug === PREVIEW_SLUG) {
      errors.push({ slug, message: `"${PREVIEW_SLUG}" is reserved for the template sample` });
      continue;
    }
    const result = PAGE_SCHEMAS[type].safeParse(fromCms(type, doc));
    if (result.success) {
      // Unique by URL: variants and audiences may share a slug under different products.
      const path = pagePath(type, result.data);
      if (seen.has(path)) {
        errors.push({ slug, message: `another document already uses ${path}` });
        continue;
      }
      seen.add(path);
      pages.push(result.data);
    } else {
      errors.push({ slug, message: result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ") });
    }
  }
  return { pages, errors };
}

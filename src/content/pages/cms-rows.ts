import { cmsDocType, fromCms, PAGE_SCHEMAS, type PageType } from "./cms";

/*
 * Spreadsheet rows → Sanity documents, used by studio/scripts/import-csv.ts (one CSV per page type,
 * exported from the pages workbook). Pure functions so they can be tested without Sanity.
 *
 * Column conventions (see files/cms-templates/README.md):
 * - Dotted headers build nested fields: `seo.title`, `hero.description`.
 * - Numbers build lists, starting at 1: `faq.1.question`, `faq.1.answer`, `faq.2.question`.
 * - Short lists can also go in one cell separated by " | ": `keywords`, `teamSizes`, `bullets`,
 *   `paragraphs`, comparison `values`.
 * - Images: `cover.file` (a file in the images folder, or an https URL), `cover.alt`, `cover.caption`.
 * - Empty cells are skipped; columns whose header starts with "#" are notes and ignored.
 */

/** Parse CSV (RFC 4180: quoted cells may contain commas, quotes as "" and line breaks). */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  const input = text.replace(/^﻿/, "");
  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    if (quoted) {
      if (char === '"' && input[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (char === '"') {
        quoted = false;
      } else {
        cell += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && input[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }
  if (cell !== "" || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

/** Header row + data rows → one record per non-empty row, with its spreadsheet row number. */
export function toRecords(table: string[][]): { line: number; record: Record<string, string> }[] {
  const [header = [], ...rows] = table;
  const keys = header.map((key) => key.trim());
  return rows
    .map((cells, i) => ({
      line: i + 2,
      record: Object.fromEntries(
        keys.flatMap((key, j) => {
          const value = (cells[j] ?? "").trim();
          return key && !key.startsWith("#") && value ? [[key, value]] : [];
        }),
      ),
    }))
    .filter(({ record }) => Object.keys(record).length > 0);
}

type Json = string | number | boolean | Json[] | { [key: string]: Json };
type Obj = { [key: string]: Json };

const isObj = (value: unknown): value is Obj => Boolean(value) && typeof value === "object" && !Array.isArray(value);

/** `{"faq.1.question": "Q"}` → `{ faq: [{ question: "Q" }] }`. Numbered segments are 1-based list positions. */
export function unflatten(record: Record<string, string>): Obj {
  const root: Obj = {};
  for (const [path, value] of Object.entries(record)) {
    const parts = path.split(".");
    let node: Obj = root;
    parts.forEach((part, i) => {
      const last = i === parts.length - 1;
      const nextIsIndex = !last && /^\d+$/.test(parts[i + 1]);
      if (last) {
        node[part] = value;
      } else {
        // Lists are built as objects keyed by position, then turned into arrays below.
        if (!isObj(node[part])) node[part] = {};
        node = node[part] as Obj;
        if (nextIsIndex) node["__list"] = true;
      }
    });
  }
  return toArrays(root) as Obj;
}

function toArrays(value: Json): Json {
  if (!isObj(value)) return value;
  if (value.__list === true) {
    return Object.entries(value)
      .filter(([key]) => key !== "__list")
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([, item]) => toArrays(item));
  }
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, toArrays(item)]));
}

const LIST_KEYS = new Set(["keywords", "teamSizes", "bullets", "paragraphs", "values"]);
const NUMBER_KEYS = new Set(["perPersonCents", "baseCents", "minSeats"]);
const BOOLEAN_KEYS = new Set(["billedAnnually"]);

const splitList = (value: string) =>
  value
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);

/** Number or the original text (so validation reports it instead of silently becoming NaN). */
const toNumber = (value: string): Json => (/^-?\d+(\.\d+)?$/.test(value.trim()) ? Number(value) : value);

/** Apply the column conventions: " | " lists, numbers and yes/no flags. */
export function coerce(value: Json, key = ""): Json {
  if (Array.isArray(value)) {
    const items = value.map((item) => coerce(item));
    return key === "teamSizes" ? items.map((item) => (typeof item === "string" ? toNumber(item) : item)) : items;
  }
  if (isObj(value)) return Object.fromEntries(Object.entries(value).map(([k, item]) => [k, coerce(item, k)]));
  if (typeof value !== "string") return value;
  if (LIST_KEYS.has(key)) return coerce(splitList(value), key);
  if (NUMBER_KEYS.has(key)) return toNumber(value);
  if (BOOLEAN_KEYS.has(key)) return ["yes", "true", "1"].includes(value.toLowerCase());
  return value;
}

/** A spreadsheet row as page content (images still as `{ file, alt, caption }`). */
export function rowToContent(record: Record<string, string>): Obj {
  return coerce(unflatten(record)) as Obj;
}

/** An uploaded (or, in a dry run, pretend) image asset. */
export type UploadedImage = { assetId: string; url: string; width: number; height: number };

const isImage = (value: Json): value is Obj & { file: string } => isObj(value) && typeof value.file === "string";

/** Every image file or URL the row refers to, in order, without duplicates. */
export function imageFiles(content: Json): string[] {
  const files = new Set<string>();
  const walk = (value: Json) => {
    if (isImage(value)) files.add(value.file);
    else if (Array.isArray(value)) value.forEach(walk);
    else if (isObj(value)) Object.values(value).forEach(walk);
  };
  walk(content);
  return [...files];
}

function mapImages(value: Json, fn: (image: Obj & { file: string }) => Json): Json {
  if (isImage(value)) return fn(value);
  if (Array.isArray(value)) return value.map((item) => mapImages(item, fn));
  if (isObj(value)) return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, mapImages(item, fn)]));
  return value;
}

function uploaded(images: Map<string, UploadedImage>, file: string): UploadedImage {
  const image = images.get(file);
  if (!image) throw new Error(`Image "${file}" was not uploaded`);
  return image;
}

const today = () => new Date().toISOString().slice(0, 10);

/**
 * Check a row against the page schema exactly as the site will read it. Returns error messages
 * (empty when valid). Missing `updated` / `published` dates default to today, as on the site.
 */
export function validateContent(type: PageType, content: Obj, images: Map<string, UploadedImage>): string[] {
  const readShape = mapImages(content, ({ file, ...rest }) => {
    const image = uploaded(images, file);
    return { ...rest, src: image.url, width: image.width, height: image.height };
  }) as Obj;
  const page = {
    updated: today(),
    ...(type === "guide" ? { published: today() } : {}),
    // A product page's slug is its product (as the site's GROQ query projects it).
    ...(type === "product" ? { slug: readShape.product } : {}),
    ...readShape,
  };
  const result = PAGE_SCHEMAS[type].safeParse(fromCms(type, page));
  return result.success ? [] : result.error.issues.map((issue) => `${issue.path.join(".") || "(row)"}: ${issue.message}`);
}

/** Sanity needs a unique `_key` on every object inside an array. */
function addKeys(value: Json): Json {
  if (Array.isArray(value)) {
    return value.map((item, i) => (isObj(item) ? { _key: `k${i + 1}`, ...(addKeys(item) as Obj) } : addKeys(item)));
  }
  if (isObj(value)) return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, addKeys(item)]));
  return value;
}

/**
 * The Sanity document for a valid row. Its ID comes from the type, product and slug, so importing
 * the sheet again updates the same page. Without `publish` it lands as a draft to review in the Studio.
 */
export function toSanityDocument(type: PageType, content: Obj, images: Map<string, UploadedImage>, { publish = false } = {}): Obj {
  const { slug, ...fields } = content;
  const product = typeof content.product === "string" ? content.product : undefined;
  if (type === "product" ? !product : typeof slug !== "string") throw new Error(type === "product" ? "Row has no product" : "Row has no slug");
  const identity = type === "product" ? product : product ? `${product}-${slug}` : slug;
  const withImages = mapImages(fields, ({ file, ...rest }) => ({
    _type: "image",
    asset: { _type: "reference", _ref: uploaded(images, file).assetId },
    ...rest,
  })) as Obj;
  return {
    _id: `${publish ? "" : "drafts."}${cmsDocType(type)}-${identity}`,
    _type: cmsDocType(type),
    // Product pages have no slug field: the product is the URL.
    ...(type === "product" ? {} : { slug: { _type: "slug", current: slug } }),
    ...(addKeys(withImages) as Obj),
  };
}

/** CSV file name of each page type inside the import folder. */
export const CSV_FILES: Record<PageType, string> = {
  product: "products.csv",
  variant: "variants.csv",
  audience: "audiences.csv",
  alternative: "alternatives.csv",
  comparison: "comparisons.csv",
  feature: "features.csv",
  guide: "guides.csv",
};

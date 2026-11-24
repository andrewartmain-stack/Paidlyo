/*
 * Import pages from CSV files (one per page type, exported from the pages workbook) into Sanity.
 *
 *   cd studio
 *   npm run import -- ../files/cms-templates            # validate and upload as drafts
 *   npm run import -- ../files/cms-templates --dry-run  # validate only, nothing is sent
 *   npm run import -- ../files/cms-templates --publish  # skip review: publish straight away
 *
 * The folder holds audiences.csv, alternatives.csv, comparisons.csv, features.csv and/or
 * guides.csv, plus an images/ folder for the files named in *.file columns. Rows are matched to
 * pages by slug, so importing again updates them. Runs with your `sanity login` (no token needed).
 */
import { readFile } from "node:fs/promises";
import { basename, isAbsolute, join, resolve } from "node:path";
import { getCliClient } from "sanity/cli";
import { PAGE_TYPES } from "../../src/content/pages/cms";
import { CSV_FILES, imageFiles, parseCsv, rowToContent, toRecords, toSanityDocument, validateContent, type UploadedImage } from "../../src/content/pages/cms-rows";

const args = process.argv.slice(2).filter((arg) => arg !== "--");
const dryRun = args.includes("--dry-run");
const publish = args.includes("--publish");
const folderArg = args.find((arg) => !arg.startsWith("--"));
if (!folderArg) {
  console.error("Usage: npm run import -- <folder with CSV files> [--dry-run] [--publish]");
  process.exit(1);
}
// `sanity exec` runs from studio/; resolve the folder from where the command was typed.
const folder = isAbsolute(folderArg) ? folderArg : resolve(process.env.INIT_CWD ?? process.cwd(), folderArg);
const client = getCliClient({ apiVersion: "2025-02-06" });

const PLACEHOLDER: UploadedImage = { assetId: "image-dryrun", url: "https://cdn.sanity.io/images/dry-run/production/placeholder-1x1.png", width: 1, height: 1 };
const uploads = new Map<string, UploadedImage>();

async function readOptional(path: string): Promise<string | undefined> {
  try {
    return await readFile(path, "utf8");
  } catch {
    return undefined;
  }
}

async function upload(file: string): Promise<UploadedImage> {
  const cached = uploads.get(file);
  if (cached) return cached;
  let body: Buffer;
  if (/^https:\/\//.test(file)) {
    const response = await fetch(file);
    if (!response.ok) throw new Error(`Could not download ${file} (${response.status})`);
    body = Buffer.from(await response.arrayBuffer());
  } else {
    body = await readFile(join(folder, "images", file));
  }
  // Sanity de-duplicates identical files, so re-importing doesn't create copies.
  const asset = await client.assets.upload("image", body, { filename: basename(file) });
  const dimensions = asset.metadata?.dimensions;
  if (!dimensions) throw new Error(`Sanity returned no dimensions for ${file}`);
  const image = { assetId: asset._id, url: asset.url, width: dimensions.width, height: dimensions.height };
  uploads.set(file, image);
  return image;
}

let failed = 0;
let imported = 0;
const transaction = client.transaction();

for (const type of PAGE_TYPES) {
  const csv = await readOptional(join(folder, CSV_FILES[type]));
  if (csv === undefined) continue;
  const rows = toRecords(parseCsv(csv));
  console.log(`\n${CSV_FILES[type]}: ${rows.length} row(s)`);

  for (const { line, record } of rows) {
    const content = rowToContent(record);
    const label = `  row ${line} (${typeof content.slug === "string" ? content.slug : "no slug"})`;
    const files = imageFiles(content);
    // Validate with placeholder images first, so invalid rows never upload anything.
    const errors = validateContent(type, content, new Map(files.map((file) => [file, PLACEHOLDER])));
    if (errors.length > 0) {
      failed++;
      console.error(`✗${label}\n${errors.map((error) => `      ${error}`).join("\n")}`);
      continue;
    }
    if (dryRun) {
      console.log(`✓${label}${files.length ? ` · ${files.length} image(s)` : ""}`);
      imported++;
      continue;
    }
    try {
      const images = new Map<string, UploadedImage>();
      for (const file of files) images.set(file, await upload(file));
      transaction.createOrReplace(toSanityDocument(type, content, images, { publish }) as { _id: string; _type: string });
      console.log(`✓${label}`);
      imported++;
    } catch (error) {
      failed++;
      console.error(`✗${label}\n      ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

if (!dryRun && imported > 0) await transaction.commit();

const verb = dryRun ? "valid" : publish ? "published" : "saved as drafts (review and publish them in the Studio)";
console.log(`\n${imported} page(s) ${verb}, ${failed} row(s) with errors.`);
if (imported + failed === 0) console.log(`No CSV files found in ${folder}. Expected: ${Object.values(CSV_FILES).join(", ")}.`);
if (failed > 0) process.exitCode = 1;

import "server-only";
import { createClient } from "@sanity/client";

/**
 * Read-only Sanity client for the marketing pages. The project ID isn't secret. A read token is
 * only needed if the dataset is made private. No CDN: Next caches the results and the Sanity
 * webhook (/api/webhooks/sanity) refreshes them on publish.
 */
export const sanity = createClient({
  projectId: process.env.SANITY_PROJECT_ID ?? "f1ipt922",
  dataset: process.env.SANITY_DATASET ?? "production",
  apiVersion: "2025-02-06",
  useCdn: false,
  perspective: "published",
  token: process.env.SANITY_READ_TOKEN,
});

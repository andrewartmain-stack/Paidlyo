/** Supabase returns at most 1,000 rows per request, so larger reads go page by page. */
const PAGE_SIZE = 1000;

/**
 * Reads every page of an ordered query, up to `max` rows. The callback receives the inclusive
 * range to pass to `.range(from, to)`; give the query a stable order (e.g. ending in `id`).
 */
export async function fetchAllRows<T>(
  page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>,
  max: number,
): Promise<{ rows: T[]; truncated: boolean }> {
  const rows: T[] = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await page(offset, offset + PAGE_SIZE - 1);
    if (error || !data) throw new Error("Could not load data.");
    rows.push(...data);
    if (data.length < PAGE_SIZE) return { rows, truncated: false };
    if (rows.length >= max) return { rows: rows.slice(0, max), truncated: true };
  }
}

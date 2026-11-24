import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { cmsTag, pageTypeFromDocType } from "@/content/pages/cms";
import { isValidSanitySignature } from "@/lib/sanity-webhook";

/* Webhook projection set in Sanity: {_type, "slug": slug.current}. Extra fields are ignored. */
const payloadSchema = z.object({ _type: z.string() });

/**
 * Sanity webhook: on publish, update or delete of a page document, refresh that page type's
 * cached content. Existing pages update and new slugs become reachable without a redeploy.
 */
export async function POST(request: Request) {
  const secret = process.env.SANITY_WEBHOOK_SECRET;
  if (!secret) return new Response("Webhook not configured", { status: 500 });

  const body = await request.text();
  if (!isValidSanitySignature(body, request.headers.get("sanity-webhook-signature"), secret)) {
    return new Response("Invalid signature", { status: 401 });
  }

  let json: unknown;
  try {
    json = JSON.parse(body);
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }
  const payload = payloadSchema.safeParse(json);
  if (!payload.success) return new Response("Missing _type", { status: 400 });

  const type = pageTypeFromDocType(payload.data._type);
  if (!type) return Response.json({ received: true, ignored: payload.data._type });

  // Expire now rather than stale-while-revalidate ("max"): pages built from this data (sitemap,
  // index pages) would otherwise re-render once from the stale copy and keep it.
  revalidateTag(cmsTag(type), { expire: 0 });
  // On Vercel the sitemap route isn't refreshed by its data tags (seen 2026-11-24): purge it by path.
  revalidatePath("/sitemap.xml");
  return Response.json({ revalidated: cmsTag(type) });
}

import { revalidateTag } from "next/cache";
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

  revalidateTag(cmsTag(type), "max");
  return Response.json({ revalidated: cmsTag(type) });
}

import { createHmac, timingSafeEqual } from "node:crypto";

/*
 * Sanity signs webhook bodies with the secret set on the webhook:
 * header `sanity-webhook-signature: t=<unix ms>,v1=<base64url HMAC-SHA256 of "<t>.<body>">`.
 */

export function signSanityPayload(body: string, secret: string, timestamp: number): string {
  const digest = createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("base64url");
  return `t=${timestamp},v1=${digest}`;
}

export function isValidSanitySignature(body: string, header: string | null, secret: string): boolean {
  const match = header?.match(/^t=(\d+)[, ]+v1=([^, ]+)$/);
  if (!match) return false;
  const expected = Buffer.from(signSanityPayload(body, secret, Number(match[1])));
  const received = Buffer.from(header!.trim());
  return expected.length === received.length && timingSafeEqual(expected, received);
}

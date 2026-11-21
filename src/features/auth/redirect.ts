/** Where users land after logging in when no (valid) `next` is given. */
export const DEFAULT_AFTER_LOGIN = "/app";

/**
 * Returns `next` only if it is a same-site path (prevents open redirects such as
 * `//evil.com` or `https://evil.com`). Falls back to the dashboard.
 */
export function safeNext(next: unknown, fallback = DEFAULT_AFTER_LOGIN): string {
  if (typeof next !== "string") return fallback;
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  if (/[\u0000-\u001f]/.test(next)) return fallback;
  return next;
}

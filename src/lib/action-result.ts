/** Return type of every Server Action (see docs/API.md). */
export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[] | undefined> };

export function ok(): { ok: true; data: void };
export function ok<T>(data: T): { ok: true; data: T };
export function ok<T>(data?: T): { ok: true; data: T | undefined } {
  return { ok: true, data };
}

export function fail(
  error: string,
  fieldErrors?: Record<string, string[] | undefined>,
): { ok: false; error: string; fieldErrors?: Record<string, string[] | undefined> } {
  return { ok: false, error, fieldErrors };
}

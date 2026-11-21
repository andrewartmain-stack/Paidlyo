---
name: debugging
description: Systematic bug investigation for this Next.js + Supabase + Stripe app - reproduce, isolate, root-cause, minimal fix, regression test. Use when something is broken or behaves unexpectedly.
---

# Debugging

1. **Reproduce.** Get the exact steps, URL, input, error message and stack trace.
   Check the terminal running `npm run dev` and the browser console.
2. **Isolate.** Find the layer:
   - Rendering/hydration → Server vs Client Component boundary, `"use client"` placement
   - Data missing/empty → usually **RLS**: is the user a member of the org? Does a policy exist
     for this operation? Test the query in Supabase Studio as that user.
   - Auth/session → cookies, `proxy.ts` matcher, `getUser()` result
   - Server Action → Zod parse error, returned `{ ok: false }` ignored by the UI
   - Stripe → webhook signature secret, `stripe listen` running, event already processed
   - Types → stale `src/types/database.ts` (run `npm run db:types`)
   - Next.js API behaviour → check `node_modules/next/dist/docs/` (Next 16 differs from older versions)
3. **Root cause.** State the cause in one sentence with evidence before changing code.
   Don't guess-and-patch.
4. **Fix minimally.** Change only what the root cause requires. No drive-by refactors.
5. **Prevent.** Add a regression test when the logic is testable.
6. **Verify.** `npm run check` and re-run the reproduction steps.
7. **Report:** cause, fix, files changed, test added.

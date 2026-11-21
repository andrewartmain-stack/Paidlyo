@AGENTS.md

# Project Instructions

**Paidlyo** (paidlyo.com): affordable time-tracking + invoicing SaaS for freelancers and small
agencies (alternative to Harvest, Keito, Invoisin). Simplicity and maintainability beat cleverness.

## Stack
- Next.js 16 App Router (`proxy.ts`, not `middleware.ts`), React 19
- TypeScript (strict), Tailwind CSS v4, shadcn/ui (base-nova, Base UI primitives)
- Supabase (Postgres, Auth, RLS) via `@supabase/ssr`
- Stripe (server-side only), Zod for validation, Vitest for tests

## Architecture (details: docs/ARCHITECTURE.md)
- Feature-based: domain code lives in `src/features/<domain>/`.
- `src/app/` holds routes only; pages are thin and call feature code.
- Server Components by default; `"use client"` only for interactivity.
- Mutations via Server Actions in `features/<domain>/actions.ts`; DB queries in `features/<domain>/queries.ts`.
- Validate every external input (forms, params, webhooks) with Zod.
- Money = integer cents (`src/lib/money.ts`). Never floats.
- Every table has RLS scoped to `organization_id`. Admin client only for webhooks.
- Reuse `src/components/ui` (shadcn) before writing new components.
- Marketing site `src/app/(marketing)/` is public, static, SEO-first (seo-page skill).
  Dashboard lives under `/app/*`; it, auth pages and `/i/[token]` are noindex.

## Development Rules
- One feature at a time. Never modify unrelated files.
- Never install dependencies without approval. No extra libraries when the stack covers it.
- Never change the DB schema without approval; schema changes = new migration (database-change skill).
- Never bypass TypeScript errors (`any`, `@ts-ignore`) or delete tests to make checks pass.
- Never read or print `.env*` secrets. Never commit.

## Workflow
1. Analyse the request and inspect only relevant code.
2. Propose a plan (files, DB/API changes, risks). Wait for approval.
3. Implement only the approved scope (create-feature skill).
4. Run `npm run check` (lint + typecheck + tests).
5. Report concisely: files changed, what was done, check results, open issues.
6. Update `docs/PROGRESS.md`. Wait for approval before the next feature.

## Docs (read only when relevant)
- docs/PROGRESS.md: current state, decisions (read first in a new session)
- docs/PRODUCT.md (scope, competitors), docs/ROADMAP.md, docs/DATABASE.md, docs/API.md, docs/DEVELOPMENT.md, docs/DESIGN.md

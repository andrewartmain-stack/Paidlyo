# Development Progress

## Completed
- [x] 0 · Project foundation (Next.js 16, TS strict, Tailwind v4, shadcn base-nova, Supabase
  clients, Stripe client, Zod, Vitest, Supabase CLI, Claude agents/skills/permissions)
- [x] 1 · Design tokens & app shell (tokens from design_system.html, Inter + Manrope,
  restyled shadcn components, `/app` sidebar + mobile sheet nav, noindex)
- [x] 2 · Authentication (email + password sign-up with confirmation, log in/out, password
  reset, `src/proxy.ts` guards `/app`, `/auth/confirm`, `profiles` table + trigger, account menu)
- [x] 3 · Organization onboarding & settings (`/onboarding`, `/app/settings` with logo upload,
  `organizations` + `organization_members`, RLS helpers, `org-logos` bucket, `getCurrentOrg()`)
- [x] 4 · Clients (`/app/clients`: list, Active/Archived tabs, name search, add/edit dialog,
  archive/restore; owner/admin only; `clients` table)
- [x] 5 · Projects & tasks (`/app/tasks`, `/app/projects` grouped by client, new/edit project with
  billing method, budget and per-project tasks; `tasks`, `projects`, `project_tasks`, `save_project`)
- [x] 6a · Time tracking day view (`/app/time`: day nav, week strip, Track time dialog, timer with
  live h:mm:ss, edit/delete; `time_entries`, rate snapshot trigger, `start_timer`/`stop_timer`)
- [x] 6b · Weekly timesheet grid (`/app/time?view=week`, inline cell editing, Add row)
- [x] 7a · Invoices (`/app/invoices` list + status tabs, new invoice with payment terms, editor
  with lines/discount/tax/live totals, send/revert/void/delete; `invoices`, `invoice_items`)

- [x] 7b · Invoice from unbilled time (new invoice "Start with: Unbilled time", editor "Add
  unbilled time" with period + grouping, invoiced entries locked in day/week views, void
  releases time; migration `20261120143043_invoice_time_entries`)

- [x] 8a · Invoice preview + PDF (`/app/invoices/[id]/preview`, shared `InvoiceDocument` with
  org logo/address, "Download PDF" = browser print to PDF; a real PDF file via
  `@react-pdf/renderer` was offered and declined for now — revisit for email attachments in 9)

- [x] 8b · Client link (`invoices.share_token`, public `/i/[token]` via RPC
  `get_shared_invoice` (not for drafts), editor "Client link" card: copy / open / reset; link
  origin = `NEXT_PUBLIC_APP_URL`, else the request host)

- [x] 11a · Time report + CSV (`/app/reports`: period presets + custom range in the URL, summary
  cards, hours by client / project / task, amounts per currency; `GET /app/reports/export` CSV
  of all entries, formula-safe, UTF-8 BOM; entries read in 1,000-row pages, cap 50,000)

- [x] 10a · Manual payments (`payments` table + `record_payment` / `delete_payment` RPCs keep
  `amount_paid_cents` and status in sync; editor "Payments" card + Record payment dialog;
  invoices "Paid" tab; Void hidden while an invoice has payments). Stripe = 10b (deferred)

- [x] 11b · Unbilled + outstanding reports (report tabs; unbilled by client → project with
  "Create invoice" prefill; outstanding by age per currency; CSV `?report=unbilled|outstanding`)

- [x] 12a · Harvest CSV import (`/app/settings/import`: preview → one-transaction import via
  `import_harvest`; `time_entries.import_key` skips re-imported rows; invoiced / non-billable
  Harvest rows stay non-billable; entries under the importing user until item 14)

- [x] 13a · Subscription billing (`organization_billing` + 14-day app trial, webhook-only writes;
  `/app/settings/billing`: Stripe Checkout monthly/yearly (remaining trial carried over) and
  Customer Portal; `/api/webhooks/stripe`; trial / payment banner. Sandbox: product
  `prod_VfZqt0YSxecvdk`, prices `paidlyo_monthly` $9 / `paidlyo_yearly` $90, portal config.
  Tested end to end 2026-11-21)
- [x] 13b · Read-only when lapsed (`writeBlocked()` in 27 data-changing actions; stop timer,
  reset client link, settings, billing stay allowed; app-level only). Tested 2026-11-21
- [x] M1 · Marketing layout & SEO foundation (header, mobile menu, footer, landing page, metadata,
  sitemap, robots, OG image, JSON-LD). Production needs `NEXT_PUBLIC_APP_URL=https://paidlyo.com`

## In progress
- [ ] M3 · Pricing & legal pages — code done (`/pricing` with plan card + pricing FAQ, `/terms`,
  `/privacy` for Andrei Artemov, Romania, support@paidlyo.com; Pricing in header, Legal column in
  footer, sign-up agreement line, SoftwareApplication offers, sitemap). Prices in
  `src/content/pricing.ts` must match Stripe. Legal text is a template: review before launch.
  Waiting on: browser check, approval.
- [ ] Card-required trial — code done (`/subscribe` after onboarding; 14-day Stripe trial with card,
  first subscription only; app shell sends never-subscribed orgs to `/subscribe`; ended
  subscriptions read-only; marketing + Terms wording updated). Waiting on: migration, test, approval.
- [ ] Google sign-in — code done (`signInWithProvider`, `/auth/callback`, button on log in /
  sign up; Microsoft dropped 2026-11-21). Sign-up / reset emails also return via `/auth/callback`.
  Waiting on: Google setup in Supabase, test.
- [ ] Dashboard — code done (`/app`: greeting + quick actions, getting-started checklist, hours this
  week / unbilled / outstanding / paid this month cards, week bar chart, recent time, needs
  attention, recent invoices; members see only their own time; `features/dashboard/`). Sidebar:
  unbuilt V1 items removed. Waiting on: browser check, approval.
- [ ] UI polish — code done (pill sidebar with more spacing + timer icon, animated buttons,
  `PageIcon` on page titles, stat/settings card icons, 8 animated SVG illustrations in empty
  states, trial, import and dashboard). Waiting on: browser check, approval.
- [x] 14 · Team (done 2026-11-22): 14a members, invites (`/join/[token]`), roles, deactivate
  (`20261122125945_team_members`) · 14b person billable rates + "Person hourly rate" billing
  (`20261122185104_member_rates`) · 14c $9 per active person (Stripe quantity synced with
  proration on join / deactivate / reactivate; "Sync seats" on the billing page).

- [ ] 17 · Project budgets & alerts — code done (`features/projects/budget.ts`: hours budget = all
  time incl. running timers, amount budget = billable amount at each entry's saved rate; warning
  from 80%, over above 100%; Projects list progress bars + project edit summary for owners/admins;
  dashboard "Needs attention" lists projects ≥ 80%). No DB change. Email alerts and per-project
  thresholds not built. Waiting on: browser check, approval.

- [ ] 23 · Copy previous day / week — code done (week view: "Copy rows from last week" adds the
  project/task rows of the last week with time, up to 8 weeks back, without hours; day view:
  "Copy from <day>" creates that day's entries at 0:00 with notes, up to 30 days back, empty days
  only; archived projects/tasks skipped). Recurring entries skipped (needs a scheduled job). No DB
  change. Waiting on: browser check, approval.

- [ ] 22 · Timesheet approvals — code done (migration `20261122203304_timesheet_approvals`; off by
  default, Settings toggle; Week/Day view status banner with Submit / Withdraw / Resubmit;
  submitted + approved weeks locked in the DB; `/app/approvals` Pending / Approved / Rejected with
  approve, reject with note, reopen; dashboard "N timesheets waiting"). Sidebar shows Approvals to
  everyone like Team (members are redirected). No email reminders. DB pushed + types ✅, check + build ✅.
  Waiting on: browser test, approval.

## Next
- [ ] M2 · Features pages

## Technical decisions
- Marketing pages: build metadata with `marketingMetadata()` (`src/lib/seo.ts`; Next merges
  metadata shallowly), add each page to `PUBLIC_PAGES` in `src/content/site-map.ts`, keep copy in
  `src/content/`; never read the session in `(marketing)` (pages must stay static ○)
- Framework: Next.js 16 App Router, Server Components + Server Actions, `proxy.ts`
- UI: shadcn/ui `base-nova` style (Base UI primitives), lucide icons
- Design: warm neutral + evergreen accent, no shadows, light only (docs/DESIGN.md);
  shadcn components are customised — never `shadcn add --overwrite` them
- DB/Auth: Supabase Postgres + Auth, RLS per organization, migrations via Supabase CLI
- Supabase keys: new-style publishable/secret keys
- No Docker: hosted Supabase `dev` project for development, `prod` project for Vercel;
  CLI stays linked to dev, the user pushes migrations to prod
- Hosting: Vercel
- Auth: Supabase email + password; email links use `token_hash` → `/auth/confirm`;
  `proxy.ts` runs only on `/app`, auth pages and `/auth/*` (marketing stays static);
  session read via `getCurrentUser()` (`features/auth/queries.ts`) inside `<Suspense>`
  because `cacheComponents` is on
- Tenancy: `getCurrentOrg()` (`features/organizations/queries.ts`) is the entry point for org-scoped
  pages/actions; one org per user in the UI for now; sidebar `OrgName` doubles as the onboarding guard
- List filters (status, search) live in URL search params, parsed with a Zod schema that falls
  back to defaults (`clientFiltersSchema`); search uses `next/form`
- Clients are archived (`archived_at`), never deleted; no delete RLS policy
- Shared form helpers in `src/lib/form-schemas.ts` (`optionalAmountCents`, `checkbox`,
  `optionalText`, `archiveStatusSchema`, `escapeLike`); shared `StatusTabs`, `EmptyState`,
  `CheckboxField` components
- Cross-org integrity via composite FKs `(organization_id, x_id)` (projects → clients,
  project_tasks → projects/tasks); multi-row saves use security-invoker RPCs
- Supabase clients use `Database` from `src/types/supabase.ts`: generated types plus fixes
  (e.g. nullable RPC args the generator marks required). Never edit `database.ts` by hand
- Server-and-client helpers go in plain modules (e.g. `features/projects/href.ts`), never in
  `"use client"` files
- Time: dates are ISO strings, "today" = org timezone (`features/time/dates.ts`), weeks start
  Monday; durations are integer minutes, typed as `h:mm` or decimal hours; timers use the DB
  clock; rate/billable snapshot is computed by a DB trigger, not by app code
- Week grid cell rules live in `features/time/week.ts` (`decideCellChange`): clearing a cell
  deletes its entry unless it has notes (kept at 0:00)
- Invoices: all writes through security-definer RPCs; totals computed in SQL and mirrored in
  `features/invoices/totals.ts` (BigInt, half-up). Number = prefix + 4-digit padded counter
- Rate model mirrors Harvest (`resolveHourlyRate`); person rates wait for item 14
- `SidebarNav` reads `usePathname()` inside its own `<Suspense>` (needed for dynamic routes
  with `cacheComponents`)
- Shared form fields: `src/components/form-field.tsx` (`FormField`, `TextareaField`, `SelectField`)
- Forms: client `useFormAction` hook + Server Actions returning `ActionResult` with `fieldErrors`
- Tailwind v4 via PostCSS (`@tailwindcss/postcss`), the setup documented by Next.js
- Validation: Zod 4 · Tests: Vitest
- Money: integer cents, `src/lib/money.ts`
- PDF: browser print stylesheet first, no PDF library
- Payments: Stripe, server-side only

## Open decisions
- Timer rounding: elapsed time rounds to the nearest minute (stops < 30 s add nothing);
  rounding up was proposed (new migration for `timer_elapsed_minutes`), not approved yet
- Supabase CLI is linked to the project labelled **production**; create a dev project before launch
- Blog content format: TS data files vs MDX (`@next/mdx`) — decide in feature M4
- Invoice payments: Stripe Connect type (Standard vs Express)
- Invoice emails: skipped (2026-11-20) — users share the client link themselves. Auth emails still need custom SMTP before launch.
- Pricing: **decided 2026-11-21** — one plan ($9/month, $90/year; amounts live in Stripe);
  changed same day to a 14-day **card-required** Stripe trial (like Invoisin), charged after the
  trial; read-only when a subscription ends. **$9 per active seat** (decided 2026-11-22, item 14c).
  Tax (Stripe Tax vs Managed Payments) decided before launch
- Harvest importer source: Harvest API v2 (personal access token) vs CSV exports (or both)

## Product decisions
- Name: **Paidlyo**, domain paidlyo.com
- One Next.js project: indexed marketing site at root, dashboard at `/app/*` (noindex)
- MVP includes time tracking, invoice-from-time and a Harvest importer (see docs/PRODUCT.md)
- Rates follow Harvest's billing methods (project / task / person / none)

## Known issues
- `npm audit`: 4 moderate issues inside the `shadcn` CLI's dependency (ts-morph/minimatch),
  dev tooling only, no runtime impact.

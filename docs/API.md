# API

The app has **no public REST API**. Internal mutations are Server Actions; reads happen in
Server Components. Route Handlers exist only where something outside the app calls us.

## Route handlers
| Route | Method | Caller | Purpose | Status |
|---|---|---|---|---|
| `/api/webhooks/stripe` | POST | Stripe | Subscription events (`checkout.session.completed`, `customer.subscription.*`) → re-reads the subscription from Stripe, writes `organization_billing` via the admin client (org from subscription `metadata.organization_id`); 400 bad signature, 500 on DB error (Stripe retries). Invoice payments (10b) later | ✅ |
| — | — | — | Page `/app/settings/billing` (owner/admin): plan status, Monthly/Yearly prices read from Stripe (`STRIPE_PRICE_MONTHLY` / `STRIPE_PRICE_YEARLY`); Server Actions `startCheckout(formData)` (Stripe Checkout, subscription mode, card always collected, `trial_period_days: 14` for an organization's first subscription; `from` = `subscribe` \| `billing` picks the return page) and `openBillingPortal()` (Customer Portal) in `features/billing/actions.ts` | ✅ |
| — | — | — | Org Server Actions: `createOrganization`, `updateOrganization`, `uploadLogo`, `removeLogo` (`features/organizations/actions.ts`); RPC `create_organization` | ✅ |
| — | — | — | Client Server Actions: `addClient`, `updateClient(id, formData)`, `archiveClient(id)`, `restoreClient(id)` (`features/clients/actions.ts`); owner/admin only | ✅ |
| — | — | — | Task Server Actions: `addTask`, `updateTask(id, formData)`, `archiveTask(id)`, `restoreTask(id)` (`features/tasks/actions.ts`); owner/admin only | ✅ |
| — | — | — | Project Server Actions: `saveProject(id \| null, formData)` (RPC `save_project`), `archiveProject(id)`, `restoreProject(id)` (`features/projects/actions.ts`); owner/admin only; checks client/tasks are active in the org | ✅ |
| — | — | — | Time Server Actions: `createTimeEntry` (blank duration on today → `start_timer`), `updateTimeEntry(id, formData)`, `deleteTimeEntry(id)`, `startTimer(id)`, `stopTimer(id)`, `setWeekCell({projectId, taskId, date, duration})` (`features/time/actions.ts`); own entries only | ✅ |
| — | — | — | Invoice Server Actions: `createInvoice` (RPC `create_invoice` + optional `add_time_to_invoice`, redirects to editor), `addUnbilledTime(id, formData)`, `saveInvoice(id, payload)` (RPC `save_invoice`), `changeInvoiceStatus(id, 'send' \| 'revert' \| 'void')`, `deleteInvoice(id)` (drafts) (`features/invoices/actions.ts`); owner/admin only | ✅ |
| — | — | — | Page `/app/invoices/[id]/preview`: saved invoice rendered by `InvoiceDocument` (`features/invoices/components/invoice-document.tsx`); PDF via browser print (`@page` A4 in `globals.css`); owner/admin only | ✅ |
| — | — | — | Public page `/i/[token]` (no login, outside the proxy, noindex, `referrer: no-referrer`): `getSharedInvoice(token)` → RPC `get_shared_invoice`; Server Action `resetShareLink(id)` → RPC `reset_invoice_share_token` (owner/admin) | ✅ |
| — | — | — | Server Actions `recordPayment(id, formData)` → RPC `record_payment`, `deletePayment(invoiceId, paymentId)` → RPC `delete_payment` (owner/admin); invoices list filter `?status=paid` | ✅ |
| `/app/reports/export` | GET | Signed-in owner/admin | Report CSV. `?report=time` (default; same params as `/app/reports`: `period`, `from`, `to`, `group`; one row per entry), `unbilled` (one row per client/project), `outstanding` (one row per open invoice); 404 for members, 422 above 50,000 records; `Cache-Control: private, no-store` | ✅ |
| — | — | — | Page `/app/reports` (owner/admin; members → `/app/time`): period presets / custom range, summary, hours by client/project/task (`features/reports/`); `/app/reports/unbilled`, `/app/reports/outstanding`; `/app/invoices/new?client=<id>&source=time` prefills the new invoice form | ✅ |
| — | — | — | Page `/app/settings/import` (owner/admin): Server Actions `previewHarvestImport(formData)` (parse + compare, nothing saved) and `runHarvestImport(formData)` (same file re-parsed → RPC `import_harvest`) in `features/import/actions.ts`; file ≤ 5 MB / 20,000 rows; `includeInvoiced` checkbox | ✅ |
| `/auth/callback` | GET | Google (via Supabase), default auth emails | OAuth / email-link return URL: `exchangeCodeForSession(code)`, redirects to `safeNext(next)`; failure → `/login?error=oauth`. Started by Server Action `signInWithProvider(formData)` (`provider` = `google`) | ✅ |
| — | — | — | Page `/subscribe` (signed in, outside the app shell): organizations that never subscribed pick monthly/yearly → `startCheckout` (14-day Stripe trial, card required, first subscription only). `BillingBanner` in the app shell redirects them here | ✅ |
| `/auth/confirm` | GET | Supabase auth emails | Verifies `token_hash` + `type` (`verifyOtp`), signs the user in, redirects to `safeNext(next)`; failure → `/login?error=link` | ✅ |

## Server Action contract
```ts
type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[] | undefined> };
```
- Type + `ok()` / `fail()` helpers: `src/lib/action-result.ts`. Client forms use
  `useFormAction` (`src/hooks/use-form-action.ts`), which shows `error` and `fieldErrors`.
- Actions may `redirect()` on success instead of returning.
- Input validated with the feature's Zod schema.
- Never trust `organization_id`, totals or prices sent from the client; derive them server-side.
- Actions that change business data call `writeBlocked(org.id)` (`features/billing/guard.ts`) right
  after the org/role check and return its message when the account is read-only (trial or
  subscription ended). Exempt: `stopTimer`, `resetShareLink`, organization settings, billing, auth.

## Stripe webhook rules
- Verify signature with `STRIPE_WEBHOOK_SECRET` using the raw body (`await req.text()`).
- Idempotent: don't trust the event payload's state — re-read the object from Stripe and write
  its current state, so repeated or out-of-order events are harmless (`shouldApply` stops a late
  event for an old subscription overwriting a newer live one).
- Use the admin Supabase client (no user session in webhooks).
- Respond 2xx quickly; log and return 400 on signature failure.

Document every new route handler or public endpoint in this file.

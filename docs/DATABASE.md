# Database

> **Status:** tables marked ✅ exist (see `supabase/migrations/`); everything else is a
> PROPOSAL, created by the feature that needs it via the `database-change` skill, after approval.

## Implemented
| Table | Migration | Notes |
|---|---|---|
| ✅ `profiles` | `20261120112148_create_profiles` | `id` = `auth.users.id`, `full_name`, `email`, `created_at`. Row created by trigger `on_auth_user_created` (name from sign-up metadata `full_name`, else `name` for Google/Microsoft; since `20261121191841`); `email` synced by `on_auth_user_email_changed`. RLS: select/update own row only; `authenticated` may update `full_name` only. Co-members can also read (`shares_org_with`). |
| ✅ `organizations` | `20261120113138_create_organizations` | `name`, `address`, `currency`, `timezone`, `default_tax_rate` numeric(5,2) 0–100, `invoice_prefix` (≤10), `next_invoice_number` (≥1), `logo_path`, `created_at`, `updated_at` (trigger). RLS: members read; owner/admin update (column grants exclude `id`, timestamps); no direct insert/delete. Billing lives in `organization_billing`. |
| ✅ `organization_members` | same | `organization_id`, `user_id`, `role` enum `org_role` (owner/admin/member), unique(org, user), `archived_at` (deactivated, `20261122125945_team_members`: the RLS helpers ignore deactivated people; rows stay so their time remains). RLS: members read; writes via `create_organization`, `accept_invite`, `set_member_role`, `set_member_active`. |
| ✅ `timesheet_submissions` | `20261122203304_timesheet_approvals` | `organization_id`, `user_id` (FK → `organization_members`), `week_start` (Monday, check), `status` enum `timesheet_status` (submitted/approved/rejected), `submitted_at`, `decided_at`, `decided_by`, `note` (≤1000); unique (org, user, week). Withdrawn = no row. RLS: own or owners/admins read; writes via functions only. `organizations.timesheet_approval` (bool, default false) turns the feature on. |
| ✅ `member_rates` | `20261122185104_member_rates` | PK `(organization_id, user_id)` (FK → `organization_members`, cascade), `hourly_rate_cents` (≥0), `updated_at`. No row = no rate. Separate table so members can't read colleagues' rates. RLS: owners/admins read/insert/update/delete. |
| ✅ `organization_invites` | `20261122125945_team_members` | `token` (secret, unique), `role` (admin/member), optional `email` label, `created_by`, `expires_at` (14 days), `accepted_at`/`accepted_by`, `revoked_at`. RLS: owners/admins read; no direct writes. |
| ✅ `clients` | `20261120115408_create_clients` | `organization_id`, `name` (1–200), `email`, `address`, `currency` (ISO 4217), `archived_at`, `created_at`, `updated_at` (trigger). Index `(organization_id, archived_at, name)`. RLS: members read; owner/admin insert/update; no delete (archive instead). Column grants: update `name, email, address, currency, archived_at` only. |
| ✅ `tasks` | `20261120120122_create_projects_and_tasks` | `organization_id`, `name` (1–100), `default_hourly_rate_cents`, `is_billable`, `is_common` (pre-selected on new projects), `archived_at`, timestamps. RLS: members read; owner/admin insert/update; no delete (archive). |
| ✅ `projects` | same | `organization_id`, `client_id` (composite FK `(organization_id, client_id)` → `clients`, so a project can't point at another org's client), `name`, `code` (≤30), `billing_method` enum (`project_rate`, `task_rate`, `person_rate` (member's rate from `member_rates`, since `20261122185104`), `none`), `hourly_rate_cents`, `budget_minutes` **or** `budget_cents` (check: at most one), `notes`, `archived_at`, timestamps. RLS as tasks. Currency = the client's currency. |
| ✅ `project_tasks` | same | `project_id`, `task_id` (composite FKs within the org), `is_billable`, `hourly_rate_cents` (override; null = task default), unique(project, task). RLS: members read; owner/admin insert/update/delete. |
| ✅ `time_entries` | `20261120123027_create_time_entries` | `organization_id`, `user_id` (FK to `organization_members`), `project_id`, `task_id` (FK `(project_id, task_id)` → `project_tasks`, so the task must be on the project and can't be unticked once it has time), `spent_date`, `minutes` 0–1440, `notes`, `is_billable` + `hourly_rate_cents` (snapshot set by trigger `time_entries_set_rate` on insert / project or task change; rejects archived projects), `timer_started_at` (one running per user: partial unique index), timestamps. RLS: own entries read/insert/update/delete; owner/admin read all in org. Column grants: users can't write `is_billable`, `hourly_rate_cents`, `timer_started_at`, `user_id` (on update). `invoice_id` comes with item 7. |
| ✅ `time_entries.invoice_item_id` | `20261120143043_invoice_time_entries` | Composite FK → `invoice_items`, `on delete set null (invoice_item_id)` (removing a time line / deleting a draft frees the time). Not user-writable. Trigger `time_entries_lock_invoiced` blocks edits/deletes while the invoice isn't a draft (changing only the link is allowed). Partial index for unbilled time. |
| ✅ `time_entries.import_key` | `20261120200109_harvest_import` | Fingerprint of the imported Harvest CSV row (`harvest:` + sha256 of date, client, project, task, notes, minutes, occurrence; built in `features/import/plan.ts`). Unique `(organization_id, import_key)`, so re-importing skips rows. Insert-grantable. Trigger `time_entries_unbill_imported` (after `set_rate`, name order) forces non-billable while the transaction-local setting `paidlyo.import_non_billable` is on (only `import_harvest` sets it). |
| ✅ `invoices.share_token` | `20261120150333_invoice_share_links` | `uuid not null default gen_random_uuid()`, unique. Secret for the client link `/i/<token>`; not user-writable (only `reset_invoice_share_token`). |
| ✅ `payments` | `20261120154359_create_payments` | `amount_cents > 0`, `paid_at` date, `method` enum `payment_method` (bank_transfer, cash, card, paypal, check, stripe, other), `notes`, `stripe_payment_intent_id` unique (10b), `recorded_by`. Composite FK → `invoices` (cascade). RLS: owners/admins read; no direct writes. |
| ✅ `invoices` | `20261120140143_create_invoices` | `organization_id`, `client_id` (composite FK), `number` (unique per org), `status` enum (`draft`, `sent`, `partially_paid`, `paid`, `void`; paid states from item 10), `issue_date`, `due_date` (≥ issue), `currency` (client's, fixed at creation), `subject`, `notes`, `discount_rate`, `tax_rate` (numeric 5,2), `subtotal_cents`, `discount_cents`, `tax_cents`, `total_cents` (computed by DB), `amount_paid_cents` (item 10), `sent_at`, timestamps. RLS: owner/admin read; delete drafts only; **no direct insert/update** (functions only). |
| ✅ `invoice_items` | same | `invoice_id` (composite FK, cascade), `position`, `kind` enum (`service`, `product`, `time`; time lines from 7b), `description`, `quantity` numeric(12,2) > 0, `unit_price_cents`, `amount_cents` (computed), `project_id`. RLS: owner/admin read; writes via `save_invoice` only. |
| ✅ `organization_billing` | `20261121133828_organization_billing` | One row per org (PK `organization_id`), created by trigger `organizations_create_billing` (existing orgs backfilled). `stripe_customer_id` / `stripe_subscription_id` (unique), `subscription_status` (Stripe statuses, check), `plan_interval` (month/year), `current_period_end`, `cancel_at_period_end`, timestamps. RLS: members read; **no user writes** — only the Stripe webhook (service role). Access rules in `features/billing/access.ts`. `trial_ends_at` (app trial) dropped in `20261121191841_card_trial_and_oauth_profiles`: the 14-day trial runs in Stripe with a card. |

**Functions** (security definer, `search_path = ''`):
- `is_org_member(org_id)`, `has_org_role(org_id, org_role[])`, `shares_org_with(user_id)` — use these in every RLS policy.
- `create_organization(p_name, p_currency, p_timezone) → uuid` — creates org + owner membership atomically; one org per user in MVP (raises with hint `already_member`).
- `start_timer(p_entry_id)` / `stop_timer(p_entry_id)` — security definer, own entries only; use the DB clock; starting stops any other running timer; stopping adds rounded elapsed minutes (cap 1440). Helper `timer_elapsed_minutes(started_at)`.
- `create_invoice(org, client, issue_date, due_date) → uuid` — owner/admin; locks the org row, assigns `prefix + lpad(next, 4)` (skipping numbers already used), increments `next_invoice_number`, copies client currency + org default tax.
- `save_invoice(invoice_id, header jsonb, items jsonb)` — drafts only; replaces lines (keeps ids/kind/project of existing ones), computes amounts and totals via `recalculate_invoice_totals` (internal). Totals math mirrored in `features/invoices/totals.ts`.
- `set_invoice_status(invoice_id, 'send' | 'revert' | 'void')` — draft→sent (needs ≥1 line), sent→draft (no payments), sent→void (also releases the invoice's time entries).
- `add_time_to_invoice(invoice_id, from?, to?, grouping)` — owner/admin, drafts only; the client's billable, unbilled, stopped, non-empty entries → `time` lines grouped by `task` (project+task+rate), `project` (project+rate) or `entry`; quantity = hours rounded to 0.01, price = snapshotted rate; links entries; recalculates totals; hint `no_unbilled_time` when nothing matches.
- `get_shared_invoice(token)` — security definer, granted to `anon` + `authenticated`; returns JSON with only what's printed on the invoice (fields, items, client name/email/address, org name/address/logo_path/timezone); null for unknown tokens and drafts. No table RLS change.
- `reset_invoice_share_token(invoice_id)` — owner/admin; new token, the old link stops working.
- `record_payment(invoice_id, amount_cents, paid_at, method, notes)` — owner/admin; sent / partly paid only (hint `not_open`); amount ≤ amount due (hint `overpayment`). `delete_payment(payment_id)` — owner/admin; not on void invoices (hint `invoice_void`). Both call internal `apply_invoice_payments`: `amount_paid_cents` = sum; paid ≥ total → `paid`, > 0 → `partially_paid`, else `sent`. Invoices with payments can't be voided or reverted (existing `set_invoice_status` rules).
- `import_harvest(p_organization_id, p_payload jsonb) → {imported}` — **security invoker**, owner/admin (hint `not_allowed`): inserts the importer's new clients / tasks / projects (ids chosen by the app) and project tasks (`on conflict do nothing`), then the caller's time entries (`on conflict (organization_id, import_key) do nothing`); `non_billable_entries` go in with the non-billable setting on. One transaction.
- `save_project(p_organization_id, p_project_id, p_project jsonb, p_tasks jsonb) → uuid` — **security invoker** (RLS applies): inserts/updates a project and replaces its `project_tasks` in one transaction (hint `not_found` when updating a missing project).

- Team (`20261122125945`): `create_invite(org, role, email)` (owner: admin/member, admin: member), `revoke_invite(id)`, `get_invite_preview(token)` (anon + authenticated; org name, role, inviter, status), `accept_invite(token) → org id` (one active org per user, hint `already_member`; reactivates a deactivated member), `set_member_role(member_id, role)` (owner only), `set_member_active(member_id, active)` (owner: everyone but self; admin: members; never the owner; stops a running timer keeping its minutes). `is_org_member` / `has_org_role` / `shares_org_with` ignore deactivated memberships; `create_organization` counts active memberships only.
- Approvals (`20261122203304`): `submit_week(org, week_start)` (own; approvals on, hint `approvals_off`; no running timer that week, hint `timer_running`; rejected → submitted; approved → hint `already_approved`), `withdraw_week(org, week_start)` (own, submitted only), `review_week(id, 'approve'|'reject'|'reopen', note)` (owner/admin; reopen = approved → rejected). Trigger `time_entries_lock_submitted` (security definer, via internal `week_is_locked`) blocks insert/edit/move/delete in a submitted or approved week while approvals are on (hint `week_locked`); invoice-link-only updates pass.
- Rates (`20261122185104`): `my_hourly_rate(org) → bigint` (security definer; the caller's own rate only). `time_entries_set_rate` uses it for `person_rate` projects (entries are always the caller's own).

**Storage:** bucket `org-logos` (public read, 1 MB, PNG/JPEG/WebP). Path `<organization_id>/logo-<timestamp>.<ext>`. Members can list; owner/admin can upload/update/delete in their org's folder.

## Conventions
- Postgres via Supabase. Schema changes **only** through `supabase/migrations/*.sql`.
- `id uuid primary key default gen_random_uuid()`
- `created_at timestamptz not null default now()`, `updated_at` where rows are edited.
- Money: `bigint` cents, column suffix `_cents`. Currency: `text` ISO 4217 (`'USD'`).
- Durations: `integer` minutes. Quantities/hours: `numeric(12,2)`.
- Soft archive with `archived_at timestamptz` (clients, projects). Invoices are never deleted
  once sent — they are voided.
- Every business table: `organization_id uuid not null references organizations on delete cascade`
  + RLS enabled + policies using `is_org_member(organization_id)`.
- Status columns use Postgres enums.
- After every migration: `npm run db:types`.

## Proposed tables

### Accounts
| Table | Key columns |
|---|---|
| `profiles` | `id` (= auth.users.id), `full_name`, `email` |
| `organizations` | `name`, `currency`, `timezone`, `invoice_prefix`, `next_invoice_number`, `address`, `logo_path`, `stripe_connect_account_id` (10b) |
| `organization_members` | `organization_id`, `user_id`, `role` enum(owner, admin, member), unique(org, user) |

### Clients & projects
| Table | Key columns |
|---|---|
| `project_members` (V1) | `project_id`, `user_id`, `organization_id`, `hourly_rate_cents` (override) |

**Rate resolution** (mirrors Harvest, which keeps the importer simple): by `billing_method` —
`project_rate` → project rate; `task_rate` → project_task rate, else task default;
`person_rate` → the member's rate (`member_rates`; per-project overrides not built yet); `none` → not billable.
Implemented in `features/projects/rates.ts` (`resolveHourlyRate`). The resolved rate is **snapshotted** on the time entry so later rate changes don't alter history.

### Time
| Table | Key columns |
|---|---|
| ~~`invoices.public_token`, `paid_at`~~ | built as `invoices.share_token` (8b) and `payments.paid_at` (10a), see above |

### Invoicing
| Table | Key columns |
|---|---|
| ~~`payments`~~ | built in 10a, see above |

### Import
CSV import (12a) matches clients / projects / tasks by name and uses `time_entries.import_key` instead; `external_refs` is still the plan for the API import (12b), where Harvest ids exist.

| Table | Key columns |
|---|---|
| `external_refs` | `organization_id`, `source` ('harvest'), `entity` ('client', 'project', …), `external_id`, `local_id` — unique(org, source, entity, external_id); lets re-imports detect updated vs duplicate records |

### V1 / later
| Table | Key columns |
|---|---|
| `expenses` | `organization_id`, `user_id`, `project_id`, `spent_date`, `category`, `amount_cents`, `currency`, `notes`, `receipt_path` (Supabase Storage), `is_billable`, `invoice_id` |
| `credit_notes` + `credit_note_items` | like invoices; `invoice_id` reference, `number`, `total_cents` |
| `estimates` + `estimate_items` | like invoices; status enum(draft, sent, accepted, declined), `invoice_id` once converted |

Also later: `recurring_invoice_schedules`, `invoice_events` (sent/viewed/reminded log),
`stripe_events` (webhook idempotency).

## Key rules
- Invoice totals are computed on the server from items and stored (never trust client totals).
- Invoice numbers are assigned atomically (`next_invoice_number` incremented in a DB function).
- Time entries linked to an invoice are locked (cannot edit while `invoice_id` is set,
  unless the invoice is a draft or void).
- The public invoice page reads by `public_token` through a `security definer` function,
  exposing only that invoice's data.

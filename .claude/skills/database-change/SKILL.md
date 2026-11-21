---
name: database-change
description: Safe procedure for Supabase schema changes - migrations, RLS policies, indexes, type generation. Use for any change to tables, columns, enums, functions or policies.
---

# Database change

**Schema changes always need explicit user approval first.** Show the SQL before writing it.

## Steps
1. Read `docs/DATABASE.md` for conventions and the proposed model.
2. Create a migration: `npm run db:migration <snake_case_name>` → edit the new file in
   `supabase/migrations/`. Never edit a migration that has already been applied/committed.
3. Write the SQL following the conventions:
   - `id uuid primary key default gen_random_uuid()`, `created_at timestamptz not null default now()`
   - `organization_id uuid not null references public.organizations(id) on delete cascade`
   - money `bigint` `*_cents`, enums for statuses, `check` constraints for invariants
   - indexes on foreign keys and common filters (`organization_id`, `client_id`, dates)
   - `alter table ... enable row level security;`
   - explicit policies for select/insert/update/delete using `public.is_org_member(organization_id)`
     (stricter for destructive actions where roles matter)
4. Apply to the **dev** project: `npm run db:push` (the CLI is linked to dev; there is no local DB).
   Ask the user to confirm the linked project is dev before the first push in a session.
5. Regenerate types: `npm run db:types`.
6. Verify RLS: confirm a user from another organization cannot read/write the rows
   (dev project's SQL editor or a test).
7. Update `docs/DATABASE.md` to reflect what now exists (move items out of "proposal").
8. Run `npm run check`.

## Never
- Disable RLS or add `using (true)` policies on business tables.
- Drop columns/tables holding data without a written migration plan approved by the user.
- Link the CLI to another project, push to production, or run `supabase db reset` — the user does that.
- Fix a bad pushed migration by editing it; write a new migration that corrects it.

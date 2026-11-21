-- Harvest CSV import (roadmap item 12a): clients, projects, tasks and time entries in one
-- transaction, without importing the same Harvest row twice.

-- ---------------------------------------------------------------------------
-- import_key: fingerprint of the source row (set by the importer, computed in
-- features/import/plan.ts). Unique per organization, so re-importing a file skips rows.
-- ---------------------------------------------------------------------------
alter table public.time_entries
  add column import_key text check (char_length(import_key) <= 100);

create unique index time_entries_import_key_idx on public.time_entries (organization_id, import_key);

grant insert (import_key) on public.time_entries to authenticated;

-- ---------------------------------------------------------------------------
-- Imported rows that were non-billable (or already invoiced) in Harvest stay non-billable.
-- Runs after time_entries_set_rate (triggers fire in name order: "set_rate" < "unbill").
-- The setting is transaction-local and only turned on by import_harvest; turning it on can
-- only make one's own entries non-billable.
-- ---------------------------------------------------------------------------
create function public.time_entries_unbill_imported()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_setting('paidlyo.import_non_billable', true) = 'on' then
    new.is_billable := false;
    new.hourly_rate_cents := null;
  end if;
  return new;
end;
$$;

create trigger time_entries_unbill_imported
  before insert on public.time_entries
  for each row execute function public.time_entries_unbill_imported();

-- ---------------------------------------------------------------------------
-- import_harvest: creates the new clients / tasks / projects / project tasks (ids chosen by
-- the importer) and inserts the time entries for the caller. Rows whose import_key already
-- exists are skipped. security invoker: the caller's RLS policies and grants still apply.
-- p_payload: {clients: [{id, name, currency}], tasks: [{id, name}],
--   projects: [{id, client_id, name, code, billing_method, hourly_rate_cents}],
--   project_tasks: [{project_id, task_id, is_billable}],
--   entries / non_billable_entries: [{project_id, task_id, spent_date, minutes, notes, import_key}]}
-- Returns {"imported": <number of time entries inserted>}.
-- ---------------------------------------------------------------------------
create function public.import_harvest(p_organization_id uuid, p_payload jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_billable integer;
  v_non_billable integer;
begin
  if not public.has_org_role(p_organization_id, array['owner', 'admin']::public.org_role[]) then
    raise exception 'not allowed' using errcode = '42501', hint = 'not_allowed';
  end if;

  insert into public.clients (id, organization_id, name, currency)
  select c.id, p_organization_id, c.name, c.currency
  from jsonb_to_recordset(coalesce(p_payload->'clients', '[]')) as c(id uuid, name text, currency text);

  insert into public.tasks (id, organization_id, name)
  select t.id, p_organization_id, t.name
  from jsonb_to_recordset(coalesce(p_payload->'tasks', '[]')) as t(id uuid, name text);

  insert into public.projects (id, organization_id, client_id, name, code, billing_method, hourly_rate_cents)
  select p.id, p_organization_id, p.client_id, p.name, p.code, p.billing_method::public.billing_method,
         p.hourly_rate_cents
  from jsonb_to_recordset(coalesce(p_payload->'projects', '[]'))
    as p(id uuid, client_id uuid, name text, code text, billing_method text, hourly_rate_cents bigint);

  insert into public.project_tasks (organization_id, project_id, task_id, is_billable)
  select p_organization_id, pt.project_id, pt.task_id, pt.is_billable
  from jsonb_to_recordset(coalesce(p_payload->'project_tasks', '[]'))
    as pt(project_id uuid, task_id uuid, is_billable boolean)
  on conflict (project_id, task_id) do nothing;

  insert into public.time_entries
    (organization_id, user_id, project_id, task_id, spent_date, minutes, notes, import_key)
  select p_organization_id, (select auth.uid()), e.project_id, e.task_id, e.spent_date, e.minutes,
         e.notes, e.import_key
  from jsonb_to_recordset(coalesce(p_payload->'entries', '[]'))
    as e(project_id uuid, task_id uuid, spent_date date, minutes integer, notes text, import_key text)
  on conflict (organization_id, import_key) do nothing;
  get diagnostics v_billable = row_count;

  perform set_config('paidlyo.import_non_billable', 'on', true);
  insert into public.time_entries
    (organization_id, user_id, project_id, task_id, spent_date, minutes, notes, import_key)
  select p_organization_id, (select auth.uid()), e.project_id, e.task_id, e.spent_date, e.minutes,
         e.notes, e.import_key
  from jsonb_to_recordset(coalesce(p_payload->'non_billable_entries', '[]'))
    as e(project_id uuid, task_id uuid, spent_date date, minutes integer, notes text, import_key text)
  on conflict (organization_id, import_key) do nothing;
  get diagnostics v_non_billable = row_count;
  perform set_config('paidlyo.import_non_billable', 'off', true);

  return jsonb_build_object('imported', v_billable + v_non_billable);
end;
$$;

revoke execute on function public.import_harvest(uuid, jsonb) from public, anon;
grant execute on function public.import_harvest(uuid, jsonb) to authenticated;

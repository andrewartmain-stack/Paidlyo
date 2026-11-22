-- Billable rate per team member (roadmap item 14b) and the "person_rate" billing method.
-- Rates live in their own table so members can't read each other's rates
-- (every member can read organization_members).

-- ---------------------------------------------------------------------------
-- member_rates: one row per member with a rate; no row = no rate set.
-- ---------------------------------------------------------------------------
create table public.member_rates (
  organization_id uuid not null,
  user_id uuid not null,
  hourly_rate_cents bigint not null check (hourly_rate_cents >= 0),
  updated_at timestamptz not null default now(),
  primary key (organization_id, user_id),
  foreign key (organization_id, user_id)
    references public.organization_members (organization_id, user_id) on delete cascade
);

alter table public.member_rates enable row level security;

create policy "member_rates: owners and admins can read"
  on public.member_rates for select to authenticated
  using (public.has_org_role(organization_id, array['owner', 'admin']::public.org_role[]));

create policy "member_rates: owners and admins can insert"
  on public.member_rates for insert to authenticated
  with check (public.has_org_role(organization_id, array['owner', 'admin']::public.org_role[]));

create policy "member_rates: owners and admins can update"
  on public.member_rates for update to authenticated
  using (public.has_org_role(organization_id, array['owner', 'admin']::public.org_role[]))
  with check (public.has_org_role(organization_id, array['owner', 'admin']::public.org_role[]));

create policy "member_rates: owners and admins can delete"
  on public.member_rates for delete to authenticated
  using (public.has_org_role(organization_id, array['owner', 'admin']::public.org_role[]));

revoke all on public.member_rates from anon, authenticated;
grant select, insert, delete on public.member_rates to authenticated;
grant update (hourly_rate_cents, updated_at) on public.member_rates to authenticated;

-- ---------------------------------------------------------------------------
-- my_hourly_rate: the caller's own rate. Time entries are always the caller's own (RLS),
-- so the rate trigger only ever needs this. security definer: members bill at their rate
-- without being able to read the table.
-- ---------------------------------------------------------------------------
create function public.my_hourly_rate(p_organization_id uuid)
returns bigint
language sql
stable
security definer
set search_path = ''
as $$
  select r.hourly_rate_cents
  from public.member_rates r
  where r.organization_id = p_organization_id
    and r.user_id = (select auth.uid());
$$;

revoke execute on function public.my_hourly_rate(uuid) from public, anon;
grant execute on function public.my_hourly_rate(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- time_entries_set_rate: unchanged except person_rate now uses the member's rate
-- (mirrors resolveHourlyRate in features/projects/rates.ts).
-- ---------------------------------------------------------------------------
create or replace function public.time_entries_set_rate()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_method public.billing_method;
  v_archived_at timestamptz;
  v_project_rate bigint;
  v_task_billable boolean;
  v_override_rate bigint;
  v_default_rate bigint;
begin
  if tg_op = 'UPDATE' and new.project_id = old.project_id and new.task_id = old.task_id then
    new.is_billable := old.is_billable;
    new.hourly_rate_cents := old.hourly_rate_cents;
    return new;
  end if;

  select p.billing_method, p.archived_at, p.hourly_rate_cents,
         pt.is_billable, pt.hourly_rate_cents, t.default_hourly_rate_cents
    into v_method, v_archived_at, v_project_rate,
         v_task_billable, v_override_rate, v_default_rate
  from public.project_tasks pt
  join public.projects p on p.id = pt.project_id
  join public.tasks t on t.id = pt.task_id
  where pt.project_id = new.project_id
    and pt.task_id = new.task_id
    and pt.organization_id = new.organization_id;

  if not found then
    raise exception 'task is not enabled on this project' using errcode = '23503', hint = 'task_not_on_project';
  end if;
  if v_archived_at is not null then
    raise exception 'project is archived' using errcode = 'P0001', hint = 'project_archived';
  end if;

  new.is_billable := v_method <> 'none' and v_task_billable;
  new.hourly_rate_cents := case
    when not new.is_billable then null
    when v_method = 'project_rate' then v_project_rate
    when v_method = 'task_rate' then coalesce(v_override_rate, v_default_rate)
    when v_method = 'person_rate' then public.my_hourly_rate(new.organization_id)
    else null
  end;
  return new;
end;
$$;

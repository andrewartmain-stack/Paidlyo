-- Time entries (roadmap item 6a): day view + timer. invoice_id arrives with invoices (item 7).

create table public.time_entries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null,
  project_id uuid not null,
  task_id uuid not null,
  spent_date date not null,
  minutes integer not null default 0 check (minutes between 0 and 1440),
  notes text check (char_length(notes) <= 2000),
  -- Snapshot of the billing settings when the entry was created / moved (set by trigger).
  is_billable boolean not null default false,
  hourly_rate_cents bigint check (hourly_rate_cents >= 0),
  timer_started_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint time_entries_member_fkey foreign key (organization_id, user_id)
    references public.organization_members (organization_id, user_id) on delete cascade,
  constraint time_entries_project_fkey foreign key (organization_id, project_id)
    references public.projects (organization_id, id),
  constraint time_entries_task_fkey foreign key (organization_id, task_id)
    references public.tasks (organization_id, id),
  -- The task must be enabled on the project. Also blocks removing a task that has time.
  constraint time_entries_project_task_fkey foreign key (project_id, task_id)
    references public.project_tasks (project_id, task_id)
);

create unique index time_entries_one_timer_per_user
  on public.time_entries (user_id) where timer_started_at is not null;
create index time_entries_user_date_idx on public.time_entries (organization_id, user_id, spent_date);
create index time_entries_project_idx on public.time_entries (project_id, spent_date);
create index time_entries_task_idx on public.time_entries (task_id);

create trigger time_entries_set_updated_at
  before update on public.time_entries
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Billable flag + rate snapshot (mirrors resolveHourlyRate in features/projects/rates.ts).
-- Recomputed only when the project or task changes, so later rate edits don't rewrite history.
-- security invoker: reads projects/tasks through the caller's RLS.
-- ---------------------------------------------------------------------------
create function public.time_entries_set_rate()
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
    else null -- person_rate: team member rates arrive with item 14
  end;
  return new;
end;
$$;

create trigger time_entries_set_rate
  before insert or update on public.time_entries
  for each row execute function public.time_entries_set_rate();

-- ---------------------------------------------------------------------------
-- RLS: people see and change their own time; owners/admins can read the whole org's.
-- ---------------------------------------------------------------------------
alter table public.time_entries enable row level security;

create policy "time_entries: own entries or managers can read"
  on public.time_entries for select to authenticated
  using (
    (user_id = (select auth.uid()) and public.is_org_member(organization_id))
    or public.has_org_role(organization_id, array['owner', 'admin']::public.org_role[])
  );

create policy "time_entries: members can insert their own"
  on public.time_entries for insert to authenticated
  with check (user_id = (select auth.uid()) and public.is_org_member(organization_id));

create policy "time_entries: members can update their own"
  on public.time_entries for update to authenticated
  using (user_id = (select auth.uid()) and public.is_org_member(organization_id))
  with check (user_id = (select auth.uid()) and public.is_org_member(organization_id));

create policy "time_entries: members can delete their own"
  on public.time_entries for delete to authenticated
  using (user_id = (select auth.uid()) and public.is_org_member(organization_id));

-- Billing snapshot, timer and timestamps are server-managed (trigger / timer functions).
revoke insert, update on public.time_entries from authenticated;
grant insert (organization_id, user_id, project_id, task_id, spent_date, minutes, notes)
  on public.time_entries to authenticated;
grant update (project_id, task_id, spent_date, minutes, notes)
  on public.time_entries to authenticated;

-- ---------------------------------------------------------------------------
-- Timer. security definer (timer_started_at isn't writable by users), so each function
-- checks the caller owns the entry. Times come from the database clock.
-- ---------------------------------------------------------------------------

-- Minutes elapsed since a timer started, rounded to the nearest minute.
create function public.timer_elapsed_minutes(p_started_at timestamptz)
returns integer
language sql
stable
set search_path = ''
as $$
  select greatest(0, round(extract(epoch from (now() - p_started_at)) / 60))::integer;
$$;

create function public.stop_timer(p_entry_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
begin
  if v_user_id is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  update public.time_entries
  set minutes = least(1440, minutes + public.timer_elapsed_minutes(timer_started_at)),
      timer_started_at = null
  where id = p_entry_id
    and user_id = v_user_id
    and public.is_org_member(organization_id)
    and timer_started_at is not null;
end;
$$;

create function public.start_timer(p_entry_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_minutes integer;
begin
  if v_user_id is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  select minutes into v_minutes
  from public.time_entries
  where id = p_entry_id and user_id = v_user_id and public.is_org_member(organization_id)
  for update;

  if not found then
    raise exception 'time entry not found' using errcode = 'P0002', hint = 'not_found';
  end if;
  if v_minutes >= 1440 then
    raise exception 'entry already has 24 hours' using errcode = 'P0001', hint = 'entry_full';
  end if;

  -- One running timer per person: stop any other first.
  update public.time_entries
  set minutes = least(1440, minutes + public.timer_elapsed_minutes(timer_started_at)),
      timer_started_at = null
  where user_id = v_user_id and timer_started_at is not null and id <> p_entry_id;

  update public.time_entries
  set timer_started_at = coalesce(timer_started_at, now())
  where id = p_entry_id;
end;
$$;

revoke execute on function public.timer_elapsed_minutes(timestamptz) from public, anon;
revoke execute on function public.start_timer(uuid) from public, anon;
revoke execute on function public.stop_timer(uuid) from public, anon;
grant execute on function public.timer_elapsed_minutes(timestamptz) to authenticated;
grant execute on function public.start_timer(uuid) to authenticated;
grant execute on function public.stop_timer(uuid) to authenticated;

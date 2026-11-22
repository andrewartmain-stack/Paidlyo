-- Timesheet approvals (roadmap item 22): people submit a week, owners/admins approve or reject.
-- Off by default (organizations.timesheet_approval). While on, time in a submitted or approved
-- week is locked.

-- ---------------------------------------------------------------------------
-- Organization setting (owners/admins can update it: existing RLS update policy).
-- ---------------------------------------------------------------------------
alter table public.organizations
  add column timesheet_approval boolean not null default false;

grant update (timesheet_approval) on public.organizations to authenticated;

-- ---------------------------------------------------------------------------
-- timesheet_submissions: one row per person and week (Monday). A withdrawn week has no row.
-- ---------------------------------------------------------------------------
create type public.timesheet_status as enum ('submitted', 'approved', 'rejected');

create table public.timesheet_submissions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null,
  week_start date not null check (extract(isodow from week_start) = 1),
  status public.timesheet_status not null default 'submitted',
  submitted_at timestamptz not null default now(),
  decided_at timestamptz,
  decided_by uuid references auth.users (id) on delete set null,
  note text check (char_length(note) <= 1000),
  constraint timesheet_submissions_week_key unique (organization_id, user_id, week_start),
  constraint timesheet_submissions_member_fkey foreign key (organization_id, user_id)
    references public.organization_members (organization_id, user_id) on delete cascade
);

create index timesheet_submissions_status_idx
  on public.timesheet_submissions (organization_id, status, week_start desc);

alter table public.timesheet_submissions enable row level security;

create policy "timesheet_submissions: own or managers can read"
  on public.timesheet_submissions for select to authenticated
  using (
    (user_id = (select auth.uid()) and public.is_org_member(organization_id))
    or public.has_org_role(organization_id, array['owner', 'admin']::public.org_role[])
  );

-- Writes only through the functions below.
revoke insert, update, delete on public.timesheet_submissions from anon, authenticated;

-- ---------------------------------------------------------------------------
-- week_is_locked: approvals are on and the person's week is submitted or approved.
-- ---------------------------------------------------------------------------
create function public.week_is_locked(p_organization_id uuid, p_user_id uuid, p_date date)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.timesheet_submissions s
    join public.organizations o on o.id = s.organization_id
    where s.organization_id = p_organization_id
      and s.user_id = p_user_id
      and s.week_start = date_trunc('week', p_date)::date
      and s.status in ('submitted', 'approved')
      and o.timesheet_approval
  );
$$;

revoke execute on function public.week_is_locked(uuid, uuid, date) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Lock: no inserts, edits, moves or deletes in a locked week (old and new week are checked).
-- Changing only the invoice link / billing snapshot (invoicing) is still allowed.
-- security definer: members can't read other tables the check needs.
-- ---------------------------------------------------------------------------
create function public.time_entries_lock_submitted()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE'
    and (new.minutes, new.project_id, new.task_id, new.spent_date, new.notes, new.timer_started_at)
        is not distinct from
        (old.minutes, old.project_id, old.task_id, old.spent_date, old.notes, old.timer_started_at)
  then
    return new;
  end if;

  if tg_op in ('UPDATE', 'DELETE')
    and public.week_is_locked(old.organization_id, old.user_id, old.spent_date) then
    raise exception 'week is submitted' using errcode = 'P0001', hint = 'week_locked';
  end if;
  if tg_op in ('INSERT', 'UPDATE')
    and public.week_is_locked(new.organization_id, new.user_id, new.spent_date) then
    raise exception 'week is submitted' using errcode = 'P0001', hint = 'week_locked';
  end if;

  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

create trigger time_entries_lock_submitted
  before insert or update or delete on public.time_entries
  for each row execute function public.time_entries_lock_submitted();

-- ---------------------------------------------------------------------------
-- submit_week: the caller submits their own week (new or rejected → submitted).
-- ---------------------------------------------------------------------------
create function public.submit_week(p_organization_id uuid, p_week_start date)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status public.timesheet_status;
begin
  if not public.is_org_member(p_organization_id) then
    raise exception 'not allowed' using errcode = '42501', hint = 'not_allowed';
  end if;
  if not exists (select 1 from public.organizations o where o.id = p_organization_id and o.timesheet_approval) then
    raise exception 'approvals are off' using errcode = 'P0001', hint = 'approvals_off';
  end if;
  if extract(isodow from p_week_start) <> 1 then
    raise exception 'week must start on Monday' using errcode = '22023';
  end if;
  if exists (
    select 1 from public.time_entries te
    where te.organization_id = p_organization_id
      and te.user_id = (select auth.uid())
      and te.spent_date between p_week_start and p_week_start + 6
      and te.timer_started_at is not null
  ) then
    raise exception 'a timer is running' using errcode = 'P0001', hint = 'timer_running';
  end if;

  select s.status into v_status
  from public.timesheet_submissions s
  where s.organization_id = p_organization_id
    and s.user_id = (select auth.uid())
    and s.week_start = p_week_start
  for update;

  if v_status = 'approved' then
    raise exception 'week already approved' using errcode = 'P0001', hint = 'already_approved';
  elsif v_status = 'submitted' then
    return;
  elsif v_status = 'rejected' then
    update public.timesheet_submissions
    set status = 'submitted', submitted_at = now(), decided_at = null, decided_by = null, note = null
    where organization_id = p_organization_id
      and user_id = (select auth.uid())
      and week_start = p_week_start;
  else
    insert into public.timesheet_submissions (organization_id, user_id, week_start)
    values (p_organization_id, (select auth.uid()), p_week_start);
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- withdraw_week: the caller takes back their own submitted (not yet approved) week.
-- ---------------------------------------------------------------------------
create function public.withdraw_week(p_organization_id uuid, p_week_start date)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.timesheet_submissions s
  where s.organization_id = p_organization_id
    and s.user_id = (select auth.uid())
    and s.week_start = p_week_start
    and s.status = 'submitted'
    and public.is_org_member(p_organization_id);
  if not found then
    raise exception 'nothing to withdraw' using errcode = 'P0002', hint = 'not_found';
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- review_week: owners/admins approve or reject a submitted week, or reopen an approved one
-- (reopened weeks become rejected, so they unlock with the note).
-- ---------------------------------------------------------------------------
create function public.review_week(p_submission_id uuid, p_action text, p_note text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_from public.timesheet_status;
  v_to public.timesheet_status;
begin
  case p_action
    when 'approve' then v_from := 'submitted'; v_to := 'approved';
    when 'reject' then v_from := 'submitted'; v_to := 'rejected';
    when 'reopen' then v_from := 'approved'; v_to := 'rejected';
    else raise exception 'invalid action' using errcode = '22023';
  end case;
  if char_length(p_note) > 1000 then
    raise exception 'note too long' using errcode = '22023';
  end if;

  update public.timesheet_submissions s
  set status = v_to,
      decided_at = now(),
      decided_by = (select auth.uid()),
      note = nullif(btrim(coalesce(p_note, '')), '')
  where s.id = p_submission_id
    and s.status = v_from
    and public.has_org_role(s.organization_id, array['owner', 'admin']::public.org_role[]);
  if not found then
    raise exception 'submission not found' using errcode = 'P0002', hint = 'not_found';
  end if;
end;
$$;

revoke execute on function public.submit_week(uuid, date) from public, anon;
revoke execute on function public.withdraw_week(uuid, date) from public, anon;
revoke execute on function public.review_week(uuid, text, text) from public, anon;
grant execute on function public.submit_week(uuid, date) to authenticated;
grant execute on function public.withdraw_week(uuid, date) to authenticated;
grant execute on function public.review_week(uuid, text, text) to authenticated;

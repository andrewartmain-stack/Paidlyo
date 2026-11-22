-- Team members (item 14a): deactivating members, invite links, role changes.

-- ---------------------------------------------------------------------------
-- 1. Deactivated members keep their row (their time stays on reports and invoices)
--    but lose all access: the RLS helpers ignore them.
-- ---------------------------------------------------------------------------
alter table public.organization_members add column archived_at timestamptz;

create or replace function public.is_org_member(org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.organization_members m
    where m.organization_id = org_id and m.user_id = (select auth.uid()) and m.archived_at is null
  );
$$;

create or replace function public.has_org_role(org_id uuid, roles public.org_role[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.organization_members m
    where m.organization_id = org_id
      and m.user_id = (select auth.uid())
      and m.archived_at is null
      and m.role = any (roles)
  );
$$;

-- The viewer must be active; the other person may be deactivated (names still show on reports).
create or replace function public.shares_org_with(other_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_members mine
    join public.organization_members theirs on theirs.organization_id = mine.organization_id
    where mine.user_id = (select auth.uid()) and mine.archived_at is null and theirs.user_id = other_user_id
  );
$$;

-- One active organization per user: a deactivated person may create their own.
create or replace function public.create_organization(p_name text, p_currency text, p_timezone text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_org_id uuid;
begin
  if v_user_id is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  if exists (select 1 from public.organization_members where user_id = v_user_id and archived_at is null) then
    raise exception 'user already has an organization' using errcode = 'P0001', hint = 'already_member';
  end if;
  if not exists (select 1 from pg_catalog.pg_timezone_names where name = p_timezone) then
    raise exception 'invalid timezone' using errcode = '22023';
  end if;

  insert into public.organizations (name, currency, timezone)
  values (btrim(p_name), upper(p_currency), p_timezone)
  returning id into v_org_id;

  insert into public.organization_members (organization_id, user_id, role)
  values (v_org_id, v_user_id, 'owner');

  return v_org_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- 2. Invite links
-- ---------------------------------------------------------------------------
create table public.organization_invites (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  token uuid not null unique default gen_random_uuid(),
  role public.org_role not null default 'member' check (role in ('admin', 'member')),
  email text check (char_length(email) <= 254),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '14 days'),
  accepted_at timestamptz,
  accepted_by uuid references auth.users (id) on delete set null,
  revoked_at timestamptz
);

create index organization_invites_org_idx on public.organization_invites (organization_id, created_at desc);

alter table public.organization_invites enable row level security;

create policy "organization_invites: owners and admins can read"
  on public.organization_invites for select to authenticated
  using (public.has_org_role(organization_id, array['owner', 'admin']::public.org_role[]));

-- All writes go through the functions below.
revoke insert, update, delete on public.organization_invites from anon, authenticated;

-- Owners invite admins or members; admins invite members only.
create function public.create_invite(p_organization_id uuid, p_role public.org_role, p_email text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if p_role not in ('admin', 'member') then
    raise exception 'invalid role' using errcode = '22023';
  end if;
  if not public.has_org_role(p_organization_id, array['owner', 'admin']::public.org_role[])
     or (p_role = 'admin' and not public.has_org_role(p_organization_id, array['owner']::public.org_role[])) then
    raise exception 'not allowed' using errcode = '42501', hint = 'not_allowed';
  end if;

  insert into public.organization_invites (organization_id, role, email, created_by)
  values (p_organization_id, p_role, nullif(btrim(lower(p_email)), ''), (select auth.uid()))
  returning id into v_id;
  return v_id;
end;
$$;

create function public.revoke_invite(p_invite_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.organization_invites i
  set revoked_at = now()
  where i.id = p_invite_id
    and i.accepted_at is null
    and i.revoked_at is null
    and public.has_org_role(i.organization_id, array['owner', 'admin']::public.org_role[]);
  if not found then
    raise exception 'invite not found' using errcode = 'P0002', hint = 'not_found';
  end if;
end;
$$;

-- What the join page shows (also to signed-out visitors). Null for unknown tokens.
create function public.get_invite_preview(p_token uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'organization_name', o.name,
    'role', i.role,
    'inviter_name', coalesce(nullif(p.full_name, ''), 'A teammate'),
    'status', case
      when i.revoked_at is not null then 'revoked'
      when i.accepted_at is not null then 'used'
      when i.expires_at <= now() then 'expired'
      else 'valid'
    end
  )
  from public.organization_invites i
  join public.organizations o on o.id = i.organization_id
  left join public.profiles p on p.id = i.created_by
  where i.token = p_token;
$$;

-- Joins the signed-in user to the invite's organization. Returns the organization id.
create function public.accept_invite(p_token uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_invite public.organization_invites%rowtype;
begin
  if v_user_id is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  select * into v_invite from public.organization_invites where token = p_token for update;
  if not found or v_invite.revoked_at is not null then
    raise exception 'invite not found' using errcode = 'P0002', hint = 'not_found';
  end if;
  if v_invite.accepted_at is not null then
    -- Opening the link again after joining is fine.
    if v_invite.accepted_by = v_user_id then
      return v_invite.organization_id;
    end if;
    raise exception 'invite already used' using errcode = 'P0001', hint = 'used';
  end if;
  if v_invite.expires_at <= now() then
    raise exception 'invite expired' using errcode = 'P0001', hint = 'expired';
  end if;

  -- One active organization per user (MVP).
  if exists (
    select 1 from public.organization_members
    where user_id = v_user_id and archived_at is null and organization_id <> v_invite.organization_id
  ) then
    raise exception 'user already has an organization' using errcode = 'P0001', hint = 'already_member';
  end if;

  -- New member, or a deactivated one coming back (keeps the row and its time).
  insert into public.organization_members (organization_id, user_id, role)
  values (v_invite.organization_id, v_user_id, v_invite.role)
  on conflict (organization_id, user_id) do update
    set archived_at = null,
        role = case when public.organization_members.role = 'owner' then 'owner'::public.org_role else excluded.role end;

  update public.organization_invites
  set accepted_at = now(), accepted_by = v_user_id
  where id = v_invite.id;

  return v_invite.organization_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- 3. Managing members
-- ---------------------------------------------------------------------------
-- Owner only: switch a member between admin and member (never the owner, never yourself).
create function public.set_member_role(p_member_id uuid, p_role public.org_role)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_role not in ('admin', 'member') then
    raise exception 'invalid role' using errcode = '22023';
  end if;
  update public.organization_members m
  set role = p_role
  where m.id = p_member_id
    and m.role <> 'owner'
    and m.user_id <> (select auth.uid())
    and public.has_org_role(m.organization_id, array['owner']::public.org_role[]);
  if not found then
    raise exception 'member not found' using errcode = 'P0002', hint = 'not_found';
  end if;
end;
$$;

-- Owners manage everyone but themselves; admins manage members only. The owner can't be deactivated.
create function public.set_member_active(p_member_id uuid, p_active boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_member public.organization_members%rowtype;
begin
  select * into v_member from public.organization_members where id = p_member_id for update;
  if not found
     or v_member.role = 'owner'
     or v_member.user_id = (select auth.uid())
     or not public.has_org_role(
       v_member.organization_id,
       case when v_member.role = 'admin' then array['owner']::public.org_role[]
            else array['owner', 'admin']::public.org_role[] end
     ) then
    raise exception 'member not found' using errcode = 'P0002', hint = 'not_found';
  end if;

  if p_active and v_member.archived_at is not null and exists (
    select 1 from public.organization_members
    where user_id = v_member.user_id and archived_at is null and organization_id <> v_member.organization_id
  ) then
    raise exception 'user already has an organization' using errcode = 'P0001', hint = 'already_member';
  end if;

  update public.organization_members
  set archived_at = case when p_active then null else coalesce(archived_at, now()) end
  where id = p_member_id;

  -- Stop a deactivated person's running timer, keeping the time it counted so far.
  if not p_active then
    update public.time_entries
    set minutes = least(1440, minutes + public.timer_elapsed_minutes(timer_started_at)),
        timer_started_at = null
    where organization_id = v_member.organization_id and user_id = v_member.user_id and timer_started_at is not null;
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------
revoke execute on function public.create_invite(uuid, public.org_role, text) from public, anon;
revoke execute on function public.revoke_invite(uuid) from public, anon;
revoke execute on function public.accept_invite(uuid) from public, anon;
revoke execute on function public.set_member_role(uuid, public.org_role) from public, anon;
revoke execute on function public.set_member_active(uuid, boolean) from public, anon;
revoke execute on function public.get_invite_preview(uuid) from public;
grant execute on function public.create_invite(uuid, public.org_role, text) to authenticated;
grant execute on function public.revoke_invite(uuid) to authenticated;
grant execute on function public.accept_invite(uuid) to authenticated;
grant execute on function public.set_member_role(uuid, public.org_role) to authenticated;
grant execute on function public.set_member_active(uuid, boolean) to authenticated;
grant execute on function public.get_invite_preview(uuid) to anon, authenticated;

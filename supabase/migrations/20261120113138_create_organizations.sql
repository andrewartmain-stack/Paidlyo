-- Organizations (tenants), memberships, RLS helpers, and the logo storage bucket.

-- ---------------------------------------------------------------------------
-- Shared: updated_at trigger
-- ---------------------------------------------------------------------------
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create type public.org_role as enum ('owner', 'admin', 'member');

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 120),
  address text not null default '' check (char_length(address) <= 500),
  currency text not null default 'USD' check (currency ~ '^[A-Z]{3}$'),
  timezone text not null default 'UTC' check (char_length(timezone) <= 64),
  default_tax_rate numeric(5, 2) not null default 0 check (default_tax_rate between 0 and 100),
  invoice_prefix text not null default 'INV-' check (char_length(invoice_prefix) <= 10),
  next_invoice_number integer not null default 1 check (next_invoice_number >= 1),
  logo_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger organizations_set_updated_at
  before update on public.organizations
  for each row execute function public.set_updated_at();

create table public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.org_role not null default 'member',
  created_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create index organization_members_user_id_idx on public.organization_members (user_id);

-- ---------------------------------------------------------------------------
-- RLS helpers (security definer: they read organization_members without
-- triggering its own policies, which avoids recursion)
-- ---------------------------------------------------------------------------
create function public.is_org_member(org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.organization_members m
    where m.organization_id = org_id and m.user_id = (select auth.uid())
  );
$$;

create function public.has_org_role(org_id uuid, roles public.org_role[])
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
      and m.role = any (roles)
  );
$$;

create function public.shares_org_with(other_user_id uuid)
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
    where mine.user_id = (select auth.uid()) and theirs.user_id = other_user_id
  );
$$;

revoke execute on function public.is_org_member(uuid) from public, anon;
revoke execute on function public.has_org_role(uuid, public.org_role[]) from public, anon;
revoke execute on function public.shares_org_with(uuid) from public, anon;
grant execute on function public.is_org_member(uuid) to authenticated;
grant execute on function public.has_org_role(uuid, public.org_role[]) to authenticated;
grant execute on function public.shares_org_with(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- RLS policies
-- ---------------------------------------------------------------------------
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;

create policy "organizations: members can read"
  on public.organizations for select
  to authenticated
  using (public.is_org_member(id));

create policy "organizations: owners and admins can update"
  on public.organizations for update
  to authenticated
  using (public.has_org_role(id, array['owner', 'admin']::public.org_role[]))
  with check (public.has_org_role(id, array['owner', 'admin']::public.org_role[]));

-- No insert/delete policies: organizations are created via create_organization().
revoke insert, update, delete on public.organizations from anon, authenticated;
grant update (
  name, address, currency, timezone, default_tax_rate,
  invoice_prefix, next_invoice_number, logo_path
) on public.organizations to authenticated;

create policy "organization_members: members can read"
  on public.organization_members for select
  to authenticated
  using (public.is_org_member(organization_id));

-- Membership changes (invites, roles) come in a later feature.
revoke insert, update, delete on public.organization_members from anon, authenticated;

create policy "profiles: co-members can read"
  on public.profiles for select
  to authenticated
  using (public.shares_org_with(id));

-- ---------------------------------------------------------------------------
-- create_organization: org + owner membership in one transaction
-- ---------------------------------------------------------------------------
create function public.create_organization(p_name text, p_currency text, p_timezone text)
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

  -- MVP: one organization per user (the data model allows more).
  if exists (select 1 from public.organization_members where user_id = v_user_id) then
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

revoke execute on function public.create_organization(text, text, text) from public, anon;
grant execute on function public.create_organization(text, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Storage: organization logos (public read; path = <organization_id>/<file>)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('org-logos', 'org-logos', true, 1048576, array['image/png', 'image/jpeg', 'image/webp']);

create policy "org-logos: members can list"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'org-logos'
    and (storage.foldername(name))[1] in (
      select m.organization_id::text from public.organization_members m
      where m.user_id = (select auth.uid())
    )
  );

create policy "org-logos: owners and admins can upload"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'org-logos'
    and (storage.foldername(name))[1] in (
      select m.organization_id::text from public.organization_members m
      where m.user_id = (select auth.uid()) and m.role in ('owner', 'admin')
    )
  );

create policy "org-logos: owners and admins can update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'org-logos'
    and (storage.foldername(name))[1] in (
      select m.organization_id::text from public.organization_members m
      where m.user_id = (select auth.uid()) and m.role in ('owner', 'admin')
    )
  );

create policy "org-logos: owners and admins can delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'org-logos'
    and (storage.foldername(name))[1] in (
      select m.organization_id::text from public.organization_members m
      where m.user_id = (select auth.uid()) and m.role in ('owner', 'admin')
    )
  );

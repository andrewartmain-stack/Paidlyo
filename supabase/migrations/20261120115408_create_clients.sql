-- Clients (roadmap item 4). Archived, never deleted: invoices and time will reference them.

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 200),
  email text check (email is null or char_length(email) <= 320),
  address text check (address is null or char_length(address) <= 1000),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index clients_organization_id_idx on public.clients (organization_id, archived_at, name);

create trigger clients_set_updated_at
  before update on public.clients
  for each row execute function public.set_updated_at();

alter table public.clients enable row level security;

create policy "clients: members can read"
  on public.clients for select to authenticated
  using (public.is_org_member(organization_id));

create policy "clients: owners and admins can insert"
  on public.clients for insert to authenticated
  with check (public.has_org_role(organization_id, array['owner', 'admin']::public.org_role[]));

create policy "clients: owners and admins can update"
  on public.clients for update to authenticated
  using (public.has_org_role(organization_id, array['owner', 'admin']::public.org_role[]))
  with check (public.has_org_role(organization_id, array['owner', 'admin']::public.org_role[]));

-- No delete policy: clients are archived, never deleted.

-- Clients can't be moved to another organization, and timestamps are server-managed.
revoke update on public.clients from authenticated;
grant update (name, email, address, currency, archived_at) on public.clients to authenticated;

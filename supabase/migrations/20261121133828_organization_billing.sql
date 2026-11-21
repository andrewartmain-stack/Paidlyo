-- Billing state per organization: app trial + Stripe subscription mirror.
-- Users can only read it; the Stripe webhook (admin client) is the only writer.

create table public.organization_billing (
  organization_id uuid primary key references public.organizations (id) on delete cascade,
  trial_ends_at timestamptz not null default (now() + interval '14 days'),
  stripe_customer_id text unique check (char_length(stripe_customer_id) <= 255),
  stripe_subscription_id text unique check (char_length(stripe_subscription_id) <= 255),
  subscription_status text check (subscription_status in (
    'incomplete', 'incomplete_expired', 'trialing', 'active',
    'past_due', 'canceled', 'unpaid', 'paused'
  )),
  plan_interval text check (plan_interval in ('month', 'year')),
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger organization_billing_set_updated_at
  before update on public.organization_billing
  for each row execute function public.set_updated_at();

-- Every organization gets a billing row (and its trial) when it's created.
create function public.organizations_create_billing()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.organization_billing (organization_id) values (new.id);
  return new;
end;
$$;

revoke execute on function public.organizations_create_billing() from public, anon, authenticated;

create trigger organizations_create_billing
  after insert on public.organizations
  for each row execute function public.organizations_create_billing();

-- Existing organizations start a fresh 14-day trial.
insert into public.organization_billing (organization_id)
select id from public.organizations
on conflict (organization_id) do nothing;

-- RLS: members can read their organization's billing; nobody writes except the service role.
alter table public.organization_billing enable row level security;

create policy "organization_billing: members can read"
  on public.organization_billing for select
  to authenticated
  using (public.is_org_member(organization_id));

revoke insert, update, delete on public.organization_billing from anon, authenticated;

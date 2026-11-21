-- Invoices (roadmap item 7a): manual line items, numbering, tax, discount, statuses.
-- Time-based lines and locking invoiced time arrive in 7b; payments in item 10.

create type public.invoice_status as enum ('draft', 'sent', 'partially_paid', 'paid', 'void');
create type public.invoice_item_kind as enum ('service', 'product', 'time');

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid not null,
  number text not null check (char_length(number) between 1 and 30),
  status public.invoice_status not null default 'draft',
  issue_date date not null,
  due_date date not null,
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  subject text check (char_length(subject) <= 200),
  notes text check (char_length(notes) <= 5000),
  discount_rate numeric(5, 2) not null default 0 check (discount_rate between 0 and 100),
  tax_rate numeric(5, 2) not null default 0 check (tax_rate between 0 and 100),
  subtotal_cents bigint not null default 0 check (subtotal_cents >= 0),
  discount_cents bigint not null default 0 check (discount_cents >= 0),
  tax_cents bigint not null default 0 check (tax_cents >= 0),
  total_cents bigint not null default 0 check (total_cents >= 0),
  amount_paid_cents bigint not null default 0 check (amount_paid_cents >= 0),
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint invoices_number_key unique (organization_id, number),
  constraint invoices_org_id_key unique (organization_id, id),
  constraint invoices_client_fkey foreign key (organization_id, client_id)
    references public.clients (organization_id, id),
  constraint invoices_due_after_issue check (due_date >= issue_date)
);

create index invoices_org_status_idx on public.invoices (organization_id, status, issue_date desc);
create index invoices_client_id_idx on public.invoices (client_id);

create trigger invoices_set_updated_at
  before update on public.invoices
  for each row execute function public.set_updated_at();

create table public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  invoice_id uuid not null,
  position integer not null check (position >= 1),
  kind public.invoice_item_kind not null default 'service',
  description text not null check (char_length(description) between 1 and 1000),
  quantity numeric(12, 2) not null check (quantity > 0),
  unit_price_cents bigint not null check (unit_price_cents >= 0),
  amount_cents bigint not null check (amount_cents >= 0),
  project_id uuid,
  created_at timestamptz not null default now(),
  constraint invoice_items_org_id_key unique (organization_id, id),
  constraint invoice_items_invoice_fkey foreign key (organization_id, invoice_id)
    references public.invoices (organization_id, id) on delete cascade,
  constraint invoice_items_project_fkey foreign key (organization_id, project_id)
    references public.projects (organization_id, id)
);

create index invoice_items_invoice_idx on public.invoice_items (invoice_id, position);
create index invoice_items_project_idx on public.invoice_items (project_id);

-- ---------------------------------------------------------------------------
-- RLS: owners/admins only. All writes go through the functions below (which compute totals
-- and enforce status rules), except deleting a draft.
-- ---------------------------------------------------------------------------
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;

create policy "invoices: owners and admins can read"
  on public.invoices for select to authenticated
  using (public.has_org_role(organization_id, array['owner', 'admin']::public.org_role[]));

create policy "invoices: owners and admins can delete drafts"
  on public.invoices for delete to authenticated
  using (
    status = 'draft'
    and public.has_org_role(organization_id, array['owner', 'admin']::public.org_role[])
  );

create policy "invoice_items: owners and admins can read"
  on public.invoice_items for select to authenticated
  using (public.has_org_role(organization_id, array['owner', 'admin']::public.org_role[]));

revoke insert, update on public.invoices from authenticated;
revoke insert, update, delete on public.invoice_items from authenticated;

-- ---------------------------------------------------------------------------
-- Totals (mirrored in src/features/invoices/totals.ts — keep in sync).
-- Line amount = round(quantity × unit price); discount = round(subtotal × rate%);
-- tax = round((subtotal − discount) × rate%). round() = half away from zero.
-- ---------------------------------------------------------------------------
create function public.recalculate_invoice_totals(p_invoice_id uuid)
returns void
language plpgsql
set search_path = ''
as $$
declare
  v_subtotal bigint;
  v_discount bigint;
  v_tax bigint;
  v_discount_rate numeric;
  v_tax_rate numeric;
begin
  select discount_rate, tax_rate into v_discount_rate, v_tax_rate
  from public.invoices where id = p_invoice_id;

  select coalesce(sum(amount_cents), 0) into v_subtotal
  from public.invoice_items where invoice_id = p_invoice_id;

  v_discount := round(v_subtotal * v_discount_rate / 100);
  v_tax := round((v_subtotal - v_discount) * v_tax_rate / 100);

  update public.invoices
  set subtotal_cents = v_subtotal,
      discount_cents = v_discount,
      tax_cents = v_tax,
      total_cents = v_subtotal - v_discount + v_tax
  where id = p_invoice_id;
end;
$$;

revoke execute on function public.recalculate_invoice_totals(uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- create_invoice: new draft with the next invoice number, the client's currency and the
-- organization's default tax rate.
-- ---------------------------------------------------------------------------
create function public.create_invoice(
  p_organization_id uuid,
  p_client_id uuid,
  p_issue_date date,
  p_due_date date
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_currency text;
  v_prefix text;
  v_next integer;
  v_tax_rate numeric;
  v_number text;
  v_invoice_id uuid;
begin
  if not public.has_org_role(p_organization_id, array['owner', 'admin']::public.org_role[]) then
    raise exception 'not allowed' using errcode = '42501', hint = 'not_allowed';
  end if;

  select currency into v_currency
  from public.clients
  where id = p_client_id and organization_id = p_organization_id and archived_at is null;
  if not found then
    raise exception 'client not found' using errcode = 'P0002', hint = 'client_not_found';
  end if;

  -- Row lock on the organization serializes number assignment.
  select invoice_prefix, next_invoice_number, default_tax_rate
    into v_prefix, v_next, v_tax_rate
  from public.organizations
  where id = p_organization_id
  for update;

  -- Skip numbers already used (e.g. an invoice number edited by hand).
  loop
    v_number := v_prefix || lpad(v_next::text, 4, '0');
    exit when not exists (
      select 1 from public.invoices where organization_id = p_organization_id and number = v_number
    );
    v_next := v_next + 1;
  end loop;

  update public.organizations set next_invoice_number = v_next + 1 where id = p_organization_id;

  insert into public.invoices (
    organization_id, client_id, number, issue_date, due_date, currency, tax_rate
  )
  values (
    p_organization_id, p_client_id, v_number, p_issue_date, p_due_date, v_currency, v_tax_rate
  )
  returning id into v_invoice_id;

  return v_invoice_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- save_invoice: a draft's header + its full list of lines, then totals.
-- p_invoice: {number, issue_date, due_date, subject, notes, discount_rate, tax_rate}
-- p_items:   [{id?, kind?, description, quantity, unit_price_cents}] in display order.
--            Existing lines keep their kind/project; new lines are 'service' or 'product'.
-- ---------------------------------------------------------------------------
create function public.save_invoice(p_invoice_id uuid, p_invoice jsonb, p_items jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org_id uuid;
  v_status public.invoice_status;
  v_item jsonb;
  v_position integer := 0;
  v_item_id uuid;
  v_kind public.invoice_item_kind;
  v_quantity numeric;
  v_price bigint;
begin
  select organization_id, status into v_org_id, v_status
  from public.invoices where id = p_invoice_id
  for update;

  if not found or not public.has_org_role(v_org_id, array['owner', 'admin']::public.org_role[]) then
    raise exception 'invoice not found' using errcode = 'P0002', hint = 'not_found';
  end if;
  if v_status <> 'draft' then
    raise exception 'only drafts can be edited' using errcode = 'P0001', hint = 'not_draft';
  end if;
  if jsonb_typeof(p_items) is distinct from 'array' then
    raise exception 'p_items must be an array' using errcode = '22023';
  end if;

  update public.invoices set
    number = p_invoice->>'number',
    issue_date = (p_invoice->>'issue_date')::date,
    due_date = (p_invoice->>'due_date')::date,
    subject = p_invoice->>'subject',
    notes = p_invoice->>'notes',
    discount_rate = (p_invoice->>'discount_rate')::numeric,
    tax_rate = (p_invoice->>'tax_rate')::numeric
  where id = p_invoice_id;

  -- Remove lines that are no longer in the list.
  delete from public.invoice_items
  where invoice_id = p_invoice_id
    and id not in (
      select (i->>'id')::uuid from jsonb_array_elements(p_items) i where i->>'id' is not null
    );

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_position := v_position + 1;
    v_quantity := (v_item->>'quantity')::numeric;
    v_price := (v_item->>'unit_price_cents')::bigint;
    v_item_id := (v_item->>'id')::uuid;

    if v_item_id is not null then
      update public.invoice_items set
        position = v_position,
        description = v_item->>'description',
        quantity = v_quantity,
        unit_price_cents = v_price,
        amount_cents = round(v_quantity * v_price)
      where id = v_item_id and invoice_id = p_invoice_id;
      if not found then
        raise exception 'line item not found' using errcode = 'P0002', hint = 'item_not_found';
      end if;
    else
      v_kind := coalesce((v_item->>'kind')::public.invoice_item_kind, 'service');
      if v_kind = 'time' then
        raise exception 'time lines are created from tracked time' using errcode = '22023';
      end if;
      insert into public.invoice_items (
        organization_id, invoice_id, position, kind, description, quantity, unit_price_cents, amount_cents
      )
      values (
        v_org_id, p_invoice_id, v_position, v_kind, v_item->>'description', v_quantity, v_price,
        round(v_quantity * v_price)
      );
    end if;
  end loop;

  perform public.recalculate_invoice_totals(p_invoice_id);
end;
$$;

-- ---------------------------------------------------------------------------
-- set_invoice_status: 'send' (draft → sent), 'revert' (sent → draft, no payments),
-- 'void' (sent → void).
-- ---------------------------------------------------------------------------
create function public.set_invoice_status(p_invoice_id uuid, p_action text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org_id uuid;
  v_status public.invoice_status;
  v_paid bigint;
  v_items integer;
begin
  select organization_id, status, amount_paid_cents into v_org_id, v_status, v_paid
  from public.invoices where id = p_invoice_id
  for update;

  if not found or not public.has_org_role(v_org_id, array['owner', 'admin']::public.org_role[]) then
    raise exception 'invoice not found' using errcode = 'P0002', hint = 'not_found';
  end if;

  if p_action = 'send' and v_status = 'draft' then
    select count(*) into v_items from public.invoice_items where invoice_id = p_invoice_id;
    if v_items = 0 then
      raise exception 'add at least one line' using errcode = 'P0001', hint = 'no_items';
    end if;
    update public.invoices set status = 'sent', sent_at = now() where id = p_invoice_id;
  elsif p_action = 'revert' and v_status = 'sent' and v_paid = 0 then
    update public.invoices set status = 'draft', sent_at = null where id = p_invoice_id;
  elsif p_action = 'void' and v_status = 'sent' then
    update public.invoices set status = 'void' where id = p_invoice_id;
  else
    raise exception 'invalid status change' using errcode = 'P0001', hint = 'invalid_transition';
  end if;
end;
$$;

revoke execute on function public.create_invoice(uuid, uuid, date, date) from public, anon;
revoke execute on function public.save_invoice(uuid, jsonb, jsonb) from public, anon;
revoke execute on function public.set_invoice_status(uuid, text) from public, anon;
grant execute on function public.create_invoice(uuid, uuid, date, date) to authenticated;
grant execute on function public.save_invoice(uuid, jsonb, jsonb) to authenticated;
grant execute on function public.set_invoice_status(uuid, text) to authenticated;

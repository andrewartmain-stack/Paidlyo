-- Payments (roadmap item 10a): record payments manually; Stripe (10b) reuses the table later.

create type public.payment_method as enum
  ('bank_transfer', 'cash', 'card', 'paypal', 'check', 'stripe', 'other');

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  invoice_id uuid not null,
  amount_cents bigint not null check (amount_cents > 0),
  paid_at date not null,
  method public.payment_method not null default 'bank_transfer',
  notes text check (char_length(notes) <= 500),
  -- Set by Stripe webhooks (item 10b); unique so a webhook retry can't record a payment twice.
  stripe_payment_intent_id text unique,
  recorded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint payments_invoice_fkey foreign key (organization_id, invoice_id)
    references public.invoices (organization_id, id) on delete cascade
);

create index payments_invoice_idx on public.payments (invoice_id, paid_at);

-- ---------------------------------------------------------------------------
-- RLS: owners/admins read. Writes only through record_payment / delete_payment, which keep
-- invoices.amount_paid_cents and the status in sync.
-- ---------------------------------------------------------------------------
alter table public.payments enable row level security;

create policy "payments: owners and admins can read"
  on public.payments for select to authenticated
  using (public.has_org_role(organization_id, array['owner', 'admin']::public.org_role[]));

revoke insert, update, delete on public.payments from authenticated, anon;

-- ---------------------------------------------------------------------------
-- Internal: recompute amount paid and status from the payments.
-- paid >= total → 'paid'; paid > 0 → 'partially_paid'; else 'sent'.
-- (Mirrored by statusAfterPayments in features/invoices/payments.ts.)
-- ---------------------------------------------------------------------------
create function public.apply_invoice_payments(p_invoice_id uuid)
returns void
language plpgsql
set search_path = ''
as $$
declare
  v_paid bigint;
begin
  select coalesce(sum(amount_cents), 0) into v_paid
  from public.payments where invoice_id = p_invoice_id;

  update public.invoices
  set amount_paid_cents = v_paid,
      status = case
        when v_paid > 0 and v_paid >= total_cents then 'paid'
        when v_paid > 0 then 'partially_paid'
        else 'sent'
      end::public.invoice_status
  where id = p_invoice_id;
end;
$$;

revoke execute on function public.apply_invoice_payments(uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- record_payment: only on sent / partly paid invoices, never more than the amount due.
-- ---------------------------------------------------------------------------
create function public.record_payment(
  p_invoice_id uuid,
  p_amount_cents bigint,
  p_paid_at date,
  p_method public.payment_method,
  p_notes text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org_id uuid;
  v_status public.invoice_status;
  v_total bigint;
  v_paid bigint;
  v_payment_id uuid;
begin
  select organization_id, status, total_cents, amount_paid_cents
    into v_org_id, v_status, v_total, v_paid
  from public.invoices where id = p_invoice_id
  for update;

  if not found or not public.has_org_role(v_org_id, array['owner', 'admin']::public.org_role[]) then
    raise exception 'invoice not found' using errcode = 'P0002', hint = 'not_found';
  end if;
  if v_status not in ('sent', 'partially_paid') then
    raise exception 'payments can only be recorded on sent invoices' using errcode = 'P0001', hint = 'not_open';
  end if;
  if p_amount_cents is null or p_amount_cents <= 0 then
    raise exception 'amount must be positive' using errcode = '22023';
  end if;
  if p_amount_cents > v_total - v_paid then
    raise exception 'payment is more than the amount due' using errcode = 'P0001', hint = 'overpayment';
  end if;

  insert into public.payments (organization_id, invoice_id, amount_cents, paid_at, method, notes, recorded_by)
  values (v_org_id, p_invoice_id, p_amount_cents, p_paid_at, p_method, nullif(btrim(p_notes), ''), (select auth.uid()))
  returning id into v_payment_id;

  perform public.apply_invoice_payments(p_invoice_id);
  return v_payment_id;
end;
$$;

revoke execute on function public.record_payment(uuid, bigint, date, public.payment_method, text) from public, anon;
grant execute on function public.record_payment(uuid, bigint, date, public.payment_method, text) to authenticated;

-- ---------------------------------------------------------------------------
-- delete_payment: undo a mistaken payment (not on void invoices).
-- ---------------------------------------------------------------------------
create function public.delete_payment(p_payment_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_invoice_id uuid;
  v_org_id uuid;
  v_status public.invoice_status;
begin
  select p.invoice_id into v_invoice_id from public.payments p where p.id = p_payment_id;

  select organization_id, status into v_org_id, v_status
  from public.invoices where id = v_invoice_id
  for update;

  if not found or not public.has_org_role(v_org_id, array['owner', 'admin']::public.org_role[]) then
    raise exception 'payment not found' using errcode = 'P0002', hint = 'not_found';
  end if;
  if v_status = 'void' then
    raise exception 'invoice is void' using errcode = 'P0001', hint = 'invoice_void';
  end if;

  delete from public.payments where id = p_payment_id;
  perform public.apply_invoice_payments(v_invoice_id);
end;
$$;

revoke execute on function public.delete_payment(uuid) from public, anon;
grant execute on function public.delete_payment(uuid) to authenticated;

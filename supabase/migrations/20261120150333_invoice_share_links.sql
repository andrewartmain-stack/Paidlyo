-- Client link (roadmap item 8b): a secret, no-login link per invoice at /i/<share_token>.

-- uuid v4 = 122 random bits: unguessable. The volatile default gives existing invoices a token each.
alter table public.invoices
  add column share_token uuid not null default gen_random_uuid(),
  add constraint invoices_share_token_key unique (share_token);

-- share_token is not in the invoices update grants (there are none for users), so it can only
-- change through reset_invoice_share_token. Owners/admins read it through the existing RLS.

-- ---------------------------------------------------------------------------
-- get_shared_invoice: what the client link shows. security definer because anonymous visitors
-- have no table access; it exposes only what's printed on the invoice. Drafts and unknown
-- tokens return null.
-- ---------------------------------------------------------------------------
create function public.get_shared_invoice(p_token uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'number', i.number,
    'status', i.status,
    'issue_date', i.issue_date,
    'due_date', i.due_date,
    'currency', i.currency,
    'subject', i.subject,
    'notes', i.notes,
    'discount_rate', i.discount_rate,
    'tax_rate', i.tax_rate,
    'subtotal_cents', i.subtotal_cents,
    'discount_cents', i.discount_cents,
    'tax_cents', i.tax_cents,
    'total_cents', i.total_cents,
    'amount_paid_cents', i.amount_paid_cents,
    'client', jsonb_build_object('name', c.name, 'email', c.email, 'address', c.address),
    'organization', jsonb_build_object(
      'name', o.name, 'address', o.address, 'logo_path', o.logo_path, 'timezone', o.timezone
    ),
    'items', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'position', it.position,
            'description', it.description,
            'quantity', it.quantity,
            'unit_price_cents', it.unit_price_cents,
            'amount_cents', it.amount_cents
          )
          order by it.position
        )
        from public.invoice_items it
        where it.invoice_id = i.id
      ),
      '[]'::jsonb
    )
  )
  from public.invoices i
  join public.clients c on c.id = i.client_id
  join public.organizations o on o.id = i.organization_id
  where i.share_token = p_token
    and i.status <> 'draft';
$$;

revoke execute on function public.get_shared_invoice(uuid) from public;
grant execute on function public.get_shared_invoice(uuid) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- reset_invoice_share_token: new link; the old one stops working. Owners/admins only.
-- ---------------------------------------------------------------------------
create function public.reset_invoice_share_token(p_invoice_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org_id uuid;
  v_token uuid := gen_random_uuid();
begin
  select organization_id into v_org_id
  from public.invoices where id = p_invoice_id
  for update;

  if not found or not public.has_org_role(v_org_id, array['owner', 'admin']::public.org_role[]) then
    raise exception 'invoice not found' using errcode = 'P0002', hint = 'not_found';
  end if;

  update public.invoices set share_token = v_token where id = p_invoice_id;
  return v_token;
end;
$$;

revoke execute on function public.reset_invoice_share_token(uuid) from public, anon;
grant execute on function public.reset_invoice_share_token(uuid) to authenticated;

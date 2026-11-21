-- Invoice from unbilled time (roadmap item 7b): link time entries to invoice lines and lock
-- entries that are on a sent invoice.

alter table public.time_entries add column invoice_item_id uuid;

-- Removing a time line from a draft, or deleting the draft, makes the time unbilled again.
alter table public.time_entries add constraint time_entries_invoice_item_fkey
  foreign key (organization_id, invoice_item_id)
  references public.invoice_items (organization_id, id)
  on delete set null (invoice_item_id);

create index time_entries_invoice_item_idx on public.time_entries (invoice_item_id);
create index time_entries_unbilled_idx on public.time_entries (organization_id, project_id)
  where invoice_item_id is null and is_billable;

-- invoice_item_id is not in the column grants from create_time_entries, so users can't set it;
-- only the functions below do.

-- ---------------------------------------------------------------------------
-- Lock: entries on a non-draft invoice can't be edited or deleted. Changing only the invoice
-- link is allowed (releasing time on void, FK set null when a draft line goes away).
-- security definer: members can't read invoices, but their entries still need the check.
-- ---------------------------------------------------------------------------
create function public.time_entries_lock_invoiced()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status public.invoice_status;
begin
  if old.invoice_item_id is null then
    return case when tg_op = 'DELETE' then old else new end;
  end if;

  select i.status into v_status
  from public.invoice_items it
  join public.invoices i on i.id = it.invoice_id
  where it.id = old.invoice_item_id;

  if v_status is null or v_status = 'draft' then
    return case when tg_op = 'DELETE' then old else new end;
  end if;

  if tg_op = 'UPDATE'
    and (new.minutes, new.project_id, new.task_id, new.spent_date, new.notes, new.timer_started_at)
        is not distinct from
        (old.minutes, old.project_id, old.task_id, old.spent_date, old.notes, old.timer_started_at)
  then
    return new;
  end if;

  raise exception 'time entry is on a sent invoice' using errcode = 'P0001', hint = 'entry_invoiced';
end;
$$;

create trigger time_entries_lock_invoiced
  before update or delete on public.time_entries
  for each row execute function public.time_entries_lock_invoiced();

-- ---------------------------------------------------------------------------
-- add_time_to_invoice: turns the client's unbilled time into 'time' lines on a draft.
-- p_grouping: 'task' (project + task + rate), 'project' (project + rate), 'entry' (one per entry).
-- p_from / p_to: optional inclusive date range. Returns the number of lines added.
-- ---------------------------------------------------------------------------
create function public.add_time_to_invoice(
  p_invoice_id uuid,
  p_from date,
  p_to date,
  p_grouping text
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org_id uuid;
  v_client_id uuid;
  v_status public.invoice_status;
  v_position integer;
  v_count integer := 0;
  v_item_id uuid;
  v_quantity numeric;
  v_price bigint;
  v_description text;
  r record;
begin
  select organization_id, client_id, status into v_org_id, v_client_id, v_status
  from public.invoices where id = p_invoice_id
  for update;

  if not found or not public.has_org_role(v_org_id, array['owner', 'admin']::public.org_role[]) then
    raise exception 'invoice not found' using errcode = 'P0002', hint = 'not_found';
  end if;
  if v_status <> 'draft' then
    raise exception 'only drafts can be edited' using errcode = 'P0001', hint = 'not_draft';
  end if;
  if p_grouping not in ('task', 'project', 'entry') then
    raise exception 'invalid grouping' using errcode = '22023';
  end if;

  select coalesce(max(position), 0) into v_position
  from public.invoice_items where invoice_id = p_invoice_id;

  for r in
    select
      u.project_id,
      (array_agg(u.project_name))[1] as project_name,
      (array_agg(u.task_name))[1] as task_name,
      (array_agg(u.notes))[1] as notes,
      min(u.spent_date) as first_date,
      sum(u.minutes) as minutes,
      u.hourly_rate_cents,
      array_agg(u.id) as entry_ids
    from (
      select te.id, te.project_id, te.task_id, te.minutes, te.hourly_rate_cents, te.spent_date,
             te.notes, p.name as project_name, t.name as task_name
      from public.time_entries te
      join public.projects p on p.id = te.project_id
      join public.tasks t on t.id = te.task_id
      where te.organization_id = v_org_id
        and p.client_id = v_client_id
        and te.is_billable
        and te.invoice_item_id is null
        and te.timer_started_at is null
        and te.minutes > 0
        and (p_from is null or te.spent_date >= p_from)
        and (p_to is null or te.spent_date <= p_to)
      for update of te
    ) u
    group by
      u.project_id,
      case when p_grouping in ('task', 'entry') then u.task_id end,
      case when p_grouping = 'entry' then u.id end,
      u.hourly_rate_cents
    order by project_name, task_name, first_date
  loop
    v_position := v_position + 1;
    v_quantity := round(r.minutes / 60.0, 2);
    v_price := coalesce(r.hourly_rate_cents, 0);
    v_description := case p_grouping
      when 'project' then r.project_name
      when 'task' then r.project_name || ' — ' || r.task_name
      else to_char(r.first_date, 'DD Mon YYYY') || ' · ' || r.project_name || ' — ' || r.task_name
           || coalesce(': ' || r.notes, '')
    end;

    insert into public.invoice_items (
      organization_id, invoice_id, position, kind, description, quantity, unit_price_cents,
      amount_cents, project_id
    )
    values (
      v_org_id, p_invoice_id, v_position, 'time', left(v_description, 1000), v_quantity, v_price,
      round(v_quantity * v_price), r.project_id
    )
    returning id into v_item_id;

    update public.time_entries set invoice_item_id = v_item_id where id = any (r.entry_ids);
    v_count := v_count + 1;
  end loop;

  if v_count = 0 then
    raise exception 'no unbilled time' using errcode = 'P0001', hint = 'no_unbilled_time';
  end if;

  perform public.recalculate_invoice_totals(p_invoice_id);
  return v_count;
end;
$$;

revoke execute on function public.add_time_to_invoice(uuid, date, date, text) from public, anon;
grant execute on function public.add_time_to_invoice(uuid, date, date, text) to authenticated;

-- ---------------------------------------------------------------------------
-- set_invoice_status: same transitions as before; 'void' now also releases the invoice's time
-- so it can be billed again.
-- ---------------------------------------------------------------------------
create or replace function public.set_invoice_status(p_invoice_id uuid, p_action text)
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
    update public.time_entries set invoice_item_id = null
    where invoice_item_id in (select id from public.invoice_items where invoice_id = p_invoice_id);
    update public.invoices set status = 'void' where id = p_invoice_id;
  else
    raise exception 'invalid status change' using errcode = 'P0001', hint = 'invalid_transition';
  end if;
end;
$$;

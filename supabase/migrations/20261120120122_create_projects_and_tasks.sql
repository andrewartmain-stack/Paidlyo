-- Projects & tasks (roadmap item 5). Rate model mirrors Harvest (see docs/DATABASE.md).

-- person_rate is reserved for team member rates (roadmap item 14); the UI doesn't offer it yet.
create type public.billing_method as enum ('project_rate', 'task_rate', 'person_rate', 'none');

-- Lets child tables prove (via composite foreign keys) that a client belongs to the same org.
alter table public.clients add constraint clients_org_id_key unique (organization_id, id);

-- ---------------------------------------------------------------------------
-- Tasks: the organization's list of work types (Design, Development, …)
-- ---------------------------------------------------------------------------
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 100),
  default_hourly_rate_cents bigint check (default_hourly_rate_cents >= 0),
  is_billable boolean not null default true,
  -- Common tasks are pre-selected on new projects.
  is_common boolean not null default false,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tasks_org_id_key unique (organization_id, id)
);

create index tasks_organization_id_idx on public.tasks (organization_id, archived_at, name);

create trigger tasks_set_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Projects
-- ---------------------------------------------------------------------------
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid not null,
  name text not null check (char_length(name) between 1 and 200),
  code text check (char_length(code) <= 30),
  billing_method public.billing_method not null default 'project_rate',
  hourly_rate_cents bigint check (hourly_rate_cents >= 0),
  budget_minutes integer check (budget_minutes > 0),
  budget_cents bigint check (budget_cents > 0),
  notes text check (char_length(notes) <= 2000),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint projects_org_id_key unique (organization_id, id),
  constraint projects_client_fkey foreign key (organization_id, client_id)
    references public.clients (organization_id, id),
  constraint projects_single_budget check (budget_minutes is null or budget_cents is null)
);

create index projects_organization_id_idx on public.projects (organization_id, archived_at, name);
create index projects_client_id_idx on public.projects (client_id);

create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Project tasks: which tasks a project uses, with billable flag and rate override
-- ---------------------------------------------------------------------------
create table public.project_tasks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null,
  task_id uuid not null,
  is_billable boolean not null default true,
  -- Override for task_rate billing; null = use the task's default rate.
  hourly_rate_cents bigint check (hourly_rate_cents >= 0),
  created_at timestamptz not null default now(),
  constraint project_tasks_project_task_key unique (project_id, task_id),
  constraint project_tasks_project_fkey foreign key (organization_id, project_id)
    references public.projects (organization_id, id) on delete cascade,
  constraint project_tasks_task_fkey foreign key (organization_id, task_id)
    references public.tasks (organization_id, id)
);

create index project_tasks_task_id_idx on public.project_tasks (task_id);

-- ---------------------------------------------------------------------------
-- RLS: members read; owners/admins write. Tasks and projects are archived, never deleted.
-- ---------------------------------------------------------------------------
alter table public.tasks enable row level security;
alter table public.projects enable row level security;
alter table public.project_tasks enable row level security;

create policy "tasks: members can read"
  on public.tasks for select to authenticated
  using (public.is_org_member(organization_id));
create policy "tasks: owners and admins can insert"
  on public.tasks for insert to authenticated
  with check (public.has_org_role(organization_id, array['owner', 'admin']::public.org_role[]));
create policy "tasks: owners and admins can update"
  on public.tasks for update to authenticated
  using (public.has_org_role(organization_id, array['owner', 'admin']::public.org_role[]))
  with check (public.has_org_role(organization_id, array['owner', 'admin']::public.org_role[]));

create policy "projects: members can read"
  on public.projects for select to authenticated
  using (public.is_org_member(organization_id));
create policy "projects: owners and admins can insert"
  on public.projects for insert to authenticated
  with check (public.has_org_role(organization_id, array['owner', 'admin']::public.org_role[]));
create policy "projects: owners and admins can update"
  on public.projects for update to authenticated
  using (public.has_org_role(organization_id, array['owner', 'admin']::public.org_role[]))
  with check (public.has_org_role(organization_id, array['owner', 'admin']::public.org_role[]));

create policy "project_tasks: members can read"
  on public.project_tasks for select to authenticated
  using (public.is_org_member(organization_id));
create policy "project_tasks: owners and admins can insert"
  on public.project_tasks for insert to authenticated
  with check (public.has_org_role(organization_id, array['owner', 'admin']::public.org_role[]));
create policy "project_tasks: owners and admins can update"
  on public.project_tasks for update to authenticated
  using (public.has_org_role(organization_id, array['owner', 'admin']::public.org_role[]))
  with check (public.has_org_role(organization_id, array['owner', 'admin']::public.org_role[]));
create policy "project_tasks: owners and admins can delete"
  on public.project_tasks for delete to authenticated
  using (public.has_org_role(organization_id, array['owner', 'admin']::public.org_role[]));

-- Rows can't move between organizations/projects; timestamps are server-managed.
revoke update on public.tasks from authenticated;
grant update (name, default_hourly_rate_cents, is_billable, is_common, archived_at)
  on public.tasks to authenticated;

revoke update on public.projects from authenticated;
grant update (client_id, name, code, billing_method, hourly_rate_cents, budget_minutes,
  budget_cents, notes, archived_at)
  on public.projects to authenticated;

revoke update on public.project_tasks from authenticated;
grant update (is_billable, hourly_rate_cents) on public.project_tasks to authenticated;

-- ---------------------------------------------------------------------------
-- save_project: project + its task list in one transaction.
-- security invoker: the caller's RLS policies and grants still apply.
-- p_project: {client_id, name, code, billing_method, hourly_rate_cents, budget_minutes,
--             budget_cents, notes}
-- p_tasks:   [{task_id, is_billable, hourly_rate_cents}]  (the full desired list)
-- ---------------------------------------------------------------------------
create function public.save_project(
  p_organization_id uuid,
  p_project_id uuid,
  p_project jsonb,
  p_tasks jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_project_id uuid;
begin
  if jsonb_typeof(p_tasks) is distinct from 'array' then
    raise exception 'p_tasks must be an array' using errcode = '22023';
  end if;

  if p_project_id is null then
    insert into public.projects (
      organization_id, client_id, name, code, billing_method, hourly_rate_cents,
      budget_minutes, budget_cents, notes
    )
    values (
      p_organization_id,
      (p_project->>'client_id')::uuid,
      p_project->>'name',
      p_project->>'code',
      (p_project->>'billing_method')::public.billing_method,
      (p_project->>'hourly_rate_cents')::bigint,
      (p_project->>'budget_minutes')::integer,
      (p_project->>'budget_cents')::bigint,
      p_project->>'notes'
    )
    returning id into v_project_id;
  else
    update public.projects set
      client_id = (p_project->>'client_id')::uuid,
      name = p_project->>'name',
      code = p_project->>'code',
      billing_method = (p_project->>'billing_method')::public.billing_method,
      hourly_rate_cents = (p_project->>'hourly_rate_cents')::bigint,
      budget_minutes = (p_project->>'budget_minutes')::integer,
      budget_cents = (p_project->>'budget_cents')::bigint,
      notes = p_project->>'notes'
    where id = p_project_id and organization_id = p_organization_id
    returning id into v_project_id;

    if v_project_id is null then
      raise exception 'project not found' using errcode = 'P0002', hint = 'not_found';
    end if;
  end if;

  delete from public.project_tasks pt
  where pt.project_id = v_project_id
    and pt.task_id not in (
      select (t->>'task_id')::uuid from jsonb_array_elements(p_tasks) t
    );

  insert into public.project_tasks (organization_id, project_id, task_id, is_billable, hourly_rate_cents)
  select
    p_organization_id,
    v_project_id,
    (t->>'task_id')::uuid,
    coalesce((t->>'is_billable')::boolean, true),
    (t->>'hourly_rate_cents')::bigint
  from jsonb_array_elements(p_tasks) t
  on conflict (project_id, task_id) do update
    set is_billable = excluded.is_billable,
        hourly_rate_cents = excluded.hourly_rate_cents;

  return v_project_id;
end;
$$;

revoke execute on function public.save_project(uuid, uuid, jsonb, jsonb) from public, anon;
grant execute on function public.save_project(uuid, uuid, jsonb, jsonb) to authenticated;

import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { FolderKanban, Plus } from "lucide-react";
import { ProjectsIllustration } from "@/components/illustrations";
import { PageIcon } from "@/components/page-icon";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { StatusTabs } from "@/components/status-tabs";
import { listClients } from "@/features/clients/queries";
import { canManageOrg, getCurrentOrg } from "@/features/organizations/queries";
import { ProjectsFilters } from "@/features/projects/components/projects-filters";
import { projectsHref } from "@/features/projects/href";
import { ProjectsTable } from "@/features/projects/components/projects-table";
import { budgetProgress, type BudgetProgress } from "@/features/projects/budget";
import { listBudgetUsage, listProjects } from "@/features/projects/queries";
import { projectFiltersSchema } from "@/features/projects/schemas";

export const metadata: Metadata = { title: "Projects" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default function ProjectsPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <div className="flex flex-col gap-6">
      <Suspense fallback={<ProjectsSkeleton />}>
        <Projects searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Projects({ searchParams }: { searchParams: SearchParams }) {
  const filters = projectFiltersSchema.parse(await searchParams);
  const [org, projects, clients] = await Promise.all([
    getCurrentOrg(),
    listProjects(filters),
    listClients({ status: "active", q: "" }),
  ]);
  const canManage = canManageOrg(org);
  const budgets = canManage ? await loadBudgets(org.id, projects) : {};
  const filtered = Boolean(filters.q || filters.client);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-4">
          <PageIcon icon={FolderKanban} />
          <div>
            <h1 className="text-3xl">Projects</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Work you do for clients, with how it&apos;s billed and budgeted.
            </p>
          </div>
        </div>
        {canManage && (
          <Link href="/app/projects/new" className={buttonVariants()}>
            <Plus aria-hidden />
            New project
          </Link>
        )}
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <StatusTabs
          label="Project status"
          tabs={[
            {
              href: projectsHref({ ...filters, status: "active" }),
              label: "Active",
              active: filters.status === "active",
            },
            {
              href: projectsHref({ ...filters, status: "archived" }),
              label: "Archived",
              active: filters.status === "archived",
            },
          ]}
        />
        <ProjectsFilters
          filters={filters}
          clients={clients.map((c) => ({ value: c.id, label: c.name }))}
        />
      </div>

      {projects.length > 0 ? (
        <ProjectsTable projects={projects} canManage={canManage} budgets={budgets} />
      ) : filtered ? (
        <EmptyState
          illustration={<ProjectsIllustration className="h-32 w-auto" />}
          title="No matching projects"
          description="Try another client or search term."
        />
      ) : filters.status === "archived" ? (
        <EmptyState
          title="No archived projects"
          description="Projects you archive appear here and can be restored at any time."
        />
      ) : clients.length === 0 ? (
        <EmptyState
          illustration={<ProjectsIllustration className="h-32 w-auto" />}
          title="No projects yet"
          description="Projects belong to a client, so add a client first."
        >
          <Link href="/app/clients" className={buttonVariants({ variant: "outline" })}>
            Go to clients
          </Link>
        </EmptyState>
      ) : (
        <EmptyState
          illustration={<ProjectsIllustration className="h-32 w-auto" />}
          title="No projects yet"
          description="Create a project to choose its billing method, budget and tasks."
        />
      )}
    </>
  );
}

async function loadBudgets(
  orgId: string,
  projects: Awaited<ReturnType<typeof listProjects>>,
): Promise<Record<string, BudgetProgress>> {
  const withBudget = projects.filter((p) => p.budgetMinutes !== null || p.budgetCents !== null);
  if (withBudget.length === 0) return {};
  await connection(); // running timers count up to now
  const usage = await listBudgetUsage(orgId, withBudget.map((p) => p.id), Date.now());
  const budgets: Record<string, BudgetProgress> = {};
  for (const project of withBudget) {
    const progress = budgetProgress(project, usage.get(project.id));
    if (progress) budgets[project.id] = progress;
  }
  return budgets;
}

function ProjectsSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading projects" className="flex flex-col gap-6">
      <div className="h-14 w-64 rounded-lg bg-muted" />
      <div className="h-9 w-full rounded-lg bg-muted" />
      <div className="h-80 rounded-xl bg-muted" />
    </div>
  );
}

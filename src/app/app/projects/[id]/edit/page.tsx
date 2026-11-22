import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { canManageOrg, getCurrentOrg } from "@/features/organizations/queries";
import { ProjectForm } from "@/features/projects/components/project-form";
import { loadProjectFormOptions } from "@/features/projects/form-data";
import { budgetProgress } from "@/features/projects/budget";
import { BudgetBar } from "@/features/projects/components/budget-bar";
import { getProject, listBudgetUsage } from "@/features/projects/queries";

export const metadata: Metadata = { title: "Edit project" };

type Params = Promise<{ id: string }>;

export default function EditProjectPage({ params }: { params: Params }) {
  return (
    <div className="flex flex-col gap-6">
      <Suspense fallback={<FormSkeleton />}>
        <EditProject params={params} />
      </Suspense>
    </div>
  );
}

async function EditProject({ params }: { params: Params }) {
  const { id } = await params;
  const org = await getCurrentOrg();
  if (!canManageOrg(org)) redirect("/app/projects");
  const project = await getProject(id);
  const { clients, tasks, peopleWithoutRate } = await loadProjectFormOptions(org.id, project);
  const progress = await loadProgress(org.id, project);
  const currency = clients.find((c) => c.id === project.clientId)?.currency ?? org.currency;

  return (
    <>
      <div>
        <h1 className="text-3xl">Edit project</h1>
        <p className="mt-1 text-sm text-muted-foreground">{project.name}</p>
      </div>
      {progress && (
        <section aria-label="Budget used" className="flex flex-col gap-2 rounded-xl border bg-card p-4">
          <h2 className="text-sm font-medium">Budget used</h2>
          <BudgetBar progress={progress} currency={currency} className="max-w-md" />
        </section>
      )}
      <ProjectForm key={project.id} project={project} clients={clients} tasks={tasks} peopleWithoutRate={peopleWithoutRate} />
    </>
  );
}

async function loadProgress(orgId: string, project: Awaited<ReturnType<typeof getProject>>) {
  if (project.budgetMinutes === null && project.budgetCents === null) return null;
  await connection(); // running timers count up to now
  const usage = await listBudgetUsage(orgId, [project.id], Date.now());
  return budgetProgress(project, usage.get(project.id));
}

function FormSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading" className="flex flex-col gap-6">
      <div className="h-14 w-64 rounded-lg bg-muted" />
      <div className="h-64 rounded-xl bg-muted" />
      <div className="h-64 rounded-xl bg-muted" />
    </div>
  );
}

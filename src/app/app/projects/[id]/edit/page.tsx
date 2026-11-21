import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { canManageOrg, getCurrentOrg } from "@/features/organizations/queries";
import { ProjectForm } from "@/features/projects/components/project-form";
import { loadProjectFormOptions } from "@/features/projects/form-data";
import { getProject } from "@/features/projects/queries";

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
  const { clients, tasks } = await loadProjectFormOptions(project);

  return (
    <>
      <div>
        <h1 className="text-3xl">Edit project</h1>
        <p className="mt-1 text-sm text-muted-foreground">{project.name}</p>
      </div>
      <ProjectForm key={project.id} project={project} clients={clients} tasks={tasks} />
    </>
  );
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

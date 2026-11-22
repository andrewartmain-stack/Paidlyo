import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { canManageOrg, getCurrentOrg } from "@/features/organizations/queries";
import { ProjectForm } from "@/features/projects/components/project-form";
import { loadProjectFormOptions } from "@/features/projects/form-data";

export const metadata: Metadata = { title: "New project" };

export default function NewProjectPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl">New project</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pick the client, how the work is billed, and which tasks people can track.
        </p>
      </div>
      <Suspense fallback={<FormSkeleton />}>
        <NewProject />
      </Suspense>
    </div>
  );
}

async function NewProject() {
  const org = await getCurrentOrg();
  if (!canManageOrg(org)) redirect("/app/projects");
  const { clients, tasks, peopleWithoutRate } = await loadProjectFormOptions(org.id);
  return <ProjectForm clients={clients} tasks={tasks} peopleWithoutRate={peopleWithoutRate} />;
}

function FormSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading" className="flex flex-col gap-6">
      <div className="h-64 rounded-xl bg-muted" />
      <div className="h-64 rounded-xl bg-muted" />
    </div>
  );
}

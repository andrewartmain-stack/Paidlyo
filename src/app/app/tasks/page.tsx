import { ListChecks } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { ProjectsIllustration } from "@/components/illustrations";
import { PageIcon } from "@/components/page-icon";
import { EmptyState } from "@/components/empty-state";
import { StatusTabs } from "@/components/status-tabs";
import { canManageOrg, getCurrentOrg } from "@/features/organizations/queries";
import { NewTaskButton } from "@/features/tasks/components/new-task-button";
import { TasksTable } from "@/features/tasks/components/tasks-table";
import { listTasks } from "@/features/tasks/queries";
import { taskFiltersSchema } from "@/features/tasks/schemas";

export const metadata: Metadata = { title: "Tasks" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default function TasksPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <div className="flex flex-col gap-6">
      <Suspense fallback={<ListSkeleton />}>
        <Tasks searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Tasks({ searchParams }: { searchParams: SearchParams }) {
  const { status } = taskFiltersSchema.parse(await searchParams);
  const [org, tasks] = await Promise.all([getCurrentOrg(), listTasks(status)]);
  const canManage = canManageOrg(org);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-4">
          <PageIcon icon={ListChecks} />
          <div>
            <h1 className="text-3xl">Tasks</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              The kinds of work you track time for. Choose which ones each project uses.
            </p>
          </div>
        </div>
        {canManage && <NewTaskButton currency={org.currency} />}
      </div>

      <StatusTabs
        label="Task status"
        tabs={[
          { href: "/app/tasks", label: "Active", active: status === "active" },
          { href: "/app/tasks?status=archived", label: "Archived", active: status === "archived" },
        ]}
      />

      {tasks.length > 0 ? (
        <TasksTable tasks={tasks} canManage={canManage} currency={org.currency} />
      ) : status === "archived" ? (
        <EmptyState
          title="No archived tasks"
          description="Archived tasks can't be added to projects, and can be restored at any time."
        />
      ) : (
        <EmptyState
          illustration={<ProjectsIllustration className="h-32 w-auto" />}
          title="No tasks yet"
          description="Add tasks like Design, Development or Meetings, then pick them per project."
        />
      )}
    </>
  );
}

function ListSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading" className="flex flex-col gap-6">
      <div className="h-14 w-64 rounded-lg bg-muted" />
      <div className="h-9 w-48 rounded-lg bg-muted" />
      <div className="h-80 rounded-xl bg-muted" />
    </div>
  );
}

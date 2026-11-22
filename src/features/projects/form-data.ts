import "server-only";
import { listClients } from "@/features/clients/queries";
import { listTasks } from "@/features/tasks/queries";
import { countMembersWithoutRate } from "@/features/team/queries";
import type { ProjectFormClient } from "./components/project-form";
import type { ProjectDetail } from "./types";

/**
 * Clients and tasks for the project form: active ones, plus archived ones the project
 * already uses (so editing an old project still shows its settings).
 */
export async function loadProjectFormOptions(orgId: string, project?: ProjectDetail) {
  const [activeClients, activeTasks, peopleWithoutRate] = await Promise.all([
    listClients({ status: "active", q: "" }),
    listTasks("active"),
    countMembersWithoutRate(orgId),
  ]);

  let clients: ProjectFormClient[] = activeClients;
  let tasks = activeTasks;

  if (project) {
    if (!activeClients.some((c) => c.id === project.clientId)) {
      const archived = await listClients({ status: "archived", q: "" });
      clients = [...archived.filter((c) => c.id === project.clientId), ...activeClients];
    }
    const used = new Set(project.tasks.map((t) => t.taskId));
    if (project.tasks.some((t) => !activeTasks.some((a) => a.id === t.taskId))) {
      const archived = await listTasks("archived");
      tasks = [...activeTasks, ...archived.filter((t) => used.has(t.id))];
    }
  }

  return {
    clients: clients.map(({ id, name, currency }) => ({ id, name, currency })),
    tasks,
    peopleWithoutRate,
  };
}

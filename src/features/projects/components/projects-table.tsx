"use client";

import { Fragment, useTransition } from "react";
import Link from "next/link";
import { Archive, ArchiveRestore, MoreHorizontal, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { archiveProject, restoreProject } from "../actions";
import type { BudgetProgress } from "../budget";
import { billingSummary, budgetSummary } from "../format";
import { BudgetBar } from "./budget-bar";
import type { ProjectListItem } from "../types";

/** Projects grouped under their client (input is sorted by client, then name). */
export function ProjectsTable({
  projects,
  canManage,
  budgets = {},
}: {
  projects: ProjectListItem[];
  canManage: boolean;
  /** Budget progress by project id (owners/admins only; members see the plain budget). */
  budgets?: Record<string, BudgetProgress>;
}) {
  const [pending, startTransition] = useTransition();
  const columns = canManage ? 4 : 3;

  function toggleArchived(project: ProjectListItem) {
    startTransition(async () => {
      const archived = project.archivedAt !== null;
      const result = archived ? await restoreProject(project.id) : await archiveProject(project.id);
      if (result.ok) toast.success(archived ? `${project.name} restored` : `${project.name} archived`);
      else toast.error(result.error);
    });
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-4">Project</TableHead>
            <TableHead className="hidden sm:table-cell">Billing</TableHead>
            <TableHead className="hidden md:table-cell">Budget</TableHead>
            {canManage && (
              <TableHead className="w-12 pr-4">
                <span className="sr-only">Actions</span>
              </TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project, index) => {
            const firstOfClient = index === 0 || projects[index - 1].client.id !== project.client.id;
            const budget = budgetSummary(project);
            return (
              <Fragment key={project.id}>
                {firstOfClient && (
                  <TableRow className="bg-muted/60 hover:bg-muted/60">
                    <TableCell colSpan={columns} className="py-1.5 pl-4 text-xs font-semibold text-muted-foreground">
                      {project.client.name}
                    </TableCell>
                  </TableRow>
                )}
                <TableRow>
                  <TableCell className="pl-4">
                    <span className="flex items-center gap-2">
                      {canManage ? (
                        <Link
                          href={`/app/projects/${project.id}/edit`}
                          className="max-w-xs truncate font-medium hover:underline focus-visible:underline focus-visible:outline-none"
                        >
                          {project.name}
                        </Link>
                      ) : (
                        <span className="max-w-xs truncate font-medium">{project.name}</span>
                      )}
                      {project.code && (
                        <span className="text-xs text-muted-foreground">{project.code}</span>
                      )}
                    </span>
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground tabular-nums sm:table-cell">
                    {billingSummary(project)}
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground tabular-nums md:table-cell">
                    {budgets[project.id] ? (
                      <BudgetBar progress={budgets[project.id]} currency={project.client.currency} className="max-w-56" />
                    ) : (
                      (budget ?? "—")
                    )}
                  </TableCell>
                  {canManage && (
                    <TableCell className="pr-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              disabled={pending}
                              aria-label={`Actions for ${project.name}`}
                            />
                          }
                        >
                          <MoreHorizontal aria-hidden />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="min-w-40">
                          <DropdownMenuItem render={<Link href={`/app/projects/${project.id}/edit`} />}>
                            <Pencil aria-hidden />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toggleArchived(project)}>
                            {project.archivedAt ? (
                              <>
                                <ArchiveRestore aria-hidden />
                                Restore
                              </>
                            ) : (
                              <>
                                <Archive aria-hidden />
                                Archive
                              </>
                            )}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              </Fragment>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

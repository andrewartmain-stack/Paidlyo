"use client";

import { useState, useTransition } from "react";
import { Archive, ArchiveRestore, MoreHorizontal, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
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
import { formatMoney } from "@/lib/money";
import { archiveTask, restoreTask } from "../actions";
import type { Task } from "../types";
import { TaskFormDialog } from "./task-form-dialog";

export function TasksTable({
  tasks,
  canManage,
  currency,
}: {
  tasks: Task[];
  canManage: boolean;
  currency: string;
}) {
  const [editing, setEditing] = useState<Task | null>(null);
  const [pending, startTransition] = useTransition();

  function toggleArchived(task: Task) {
    startTransition(async () => {
      const archived = task.archivedAt !== null;
      const result = archived ? await restoreTask(task.id) : await archiveTask(task.id);
      if (result.ok) toast.success(archived ? `${task.name} restored` : `${task.name} archived`);
      else toast.error(result.error);
    });
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">Task</TableHead>
              <TableHead className="text-right">Default rate</TableHead>
              <TableHead className="hidden sm:table-cell">Billable</TableHead>
              {canManage && (
                <TableHead className="w-12 pr-4">
                  <span className="sr-only">Actions</span>
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map((task) => (
              <TableRow key={task.id}>
                <TableCell className="pl-4">
                  <span className="flex items-center gap-2">
                    <span className="max-w-xs truncate font-medium">{task.name}</span>
                    {task.isCommon && <Badge variant="secondary">Common</Badge>}
                  </span>
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {task.defaultHourlyRateCents === null ? (
                    <span className="text-muted-foreground">—</span>
                  ) : (
                    `${formatMoney(task.defaultHourlyRateCents, currency)}/h`
                  )}
                </TableCell>
                <TableCell className="hidden text-muted-foreground sm:table-cell">
                  {task.isBillable ? "Billable" : "Non-billable"}
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
                            aria-label={`Actions for ${task.name}`}
                          />
                        }
                      >
                        <MoreHorizontal aria-hidden />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="min-w-40">
                        <DropdownMenuItem onClick={() => setEditing(task)}>
                          <Pencil aria-hidden />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toggleArchived(task)}>
                          {task.archivedAt ? (
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
            ))}
          </TableBody>
        </Table>
      </div>
      {canManage && (
        <TaskFormDialog
          open={editing !== null}
          onOpenChange={(open) => !open && setEditing(null)}
          task={editing ?? undefined}
          currency={currency}
        />
      )}
    </>
  );
}

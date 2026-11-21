"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SelectField } from "@/components/form-field";
import type { TrackableProject } from "../types";

/** Picks a project + task to add as an empty week-grid row (nothing is saved until you type). */
export function AddRowDialog({
  projects,
  onAdd,
}: {
  projects: TrackableProject[];
  onAdd: (project: TrackableProject, task: { id: string; name: string }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [projectId, setProjectId] = useState(projects[0]?.id ?? "");
  const [taskId, setTaskId] = useState(projects[0]?.tasks[0]?.id ?? "");
  const project = projects.find((p) => p.id === projectId);

  function changeProject(id: string) {
    setProjectId(id);
    setTaskId(projects.find((p) => p.id === id)?.tasks[0]?.id ?? "");
  }

  function add() {
    const task = project?.tasks.find((t) => t.id === taskId);
    if (!project || !task) return;
    onAdd(project, task);
    setOpen(false);
  }

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)} disabled={projects.length === 0}>
        <Plus aria-hidden />
        Add row
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="gap-6 p-6 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg">Add row</DialogTitle>
            <DialogDescription>Choose a project and task, then type hours into the week.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-5">
            <SelectField
              name="projectId"
              label="Project"
              options={projects.map((p) => ({
                value: p.id,
                label: `${p.clientName} — ${p.name}${p.code ? ` (${p.code})` : ""}`,
              }))}
              defaultValue={projectId || undefined}
              onValueChange={changeProject}
            />
            <SelectField
              key={projectId}
              name="taskId"
              label="Task"
              options={(project?.tasks ?? []).map((t) => ({ value: t.id, label: t.name }))}
              defaultValue={taskId || undefined}
              onValueChange={setTaskId}
            />
          </div>
          <DialogFooter className="-mx-6 -mb-6 px-6">
            <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
            <Button type="button" onClick={add} disabled={!taskId}>
              Add row
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

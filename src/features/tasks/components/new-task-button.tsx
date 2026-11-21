"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TaskFormDialog } from "./task-form-dialog";

export function NewTaskButton({ currency }: { currency: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus aria-hidden />
        New task
      </Button>
      <TaskFormDialog open={open} onOpenChange={setOpen} currency={currency} />
    </>
  );
}

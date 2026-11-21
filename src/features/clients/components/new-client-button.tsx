"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SelectOption } from "@/components/form-field";
import { ClientFormDialog } from "./client-form-dialog";

export function NewClientButton({
  currencies,
  defaultCurrency,
}: {
  currencies: SelectOption[];
  defaultCurrency: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus aria-hidden />
        New client
      </Button>
      <ClientFormDialog
        open={open}
        onOpenChange={setOpen}
        currencies={currencies}
        defaultCurrency={defaultCurrency}
      />
    </>
  );
}

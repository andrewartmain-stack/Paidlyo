"use client";

import { useState, useTransition } from "react";
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
import type { SelectOption } from "@/components/form-field";
import { archiveClient, restoreClient } from "../actions";
import type { Client } from "../types";
import { ClientFormDialog } from "./client-form-dialog";

export type ClientRow = Client & { createdLabel: string };

export function ClientsTable({
  clients,
  canManage,
  currencies,
  defaultCurrency,
}: {
  clients: ClientRow[];
  canManage: boolean;
  currencies: SelectOption[];
  defaultCurrency: string;
}) {
  const [editing, setEditing] = useState<Client | null>(null);
  const [pending, startTransition] = useTransition();

  function toggleArchived(client: Client) {
    startTransition(async () => {
      const archived = client.archivedAt !== null;
      const result = archived ? await restoreClient(client.id) : await archiveClient(client.id);
      if (result.ok) toast.success(archived ? `${client.name} restored` : `${client.name} archived`);
      else toast.error(result.error);
    });
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">Name</TableHead>
              <TableHead className="hidden md:table-cell">Email</TableHead>
              <TableHead>Currency</TableHead>
              <TableHead className="hidden lg:table-cell">Added</TableHead>
              {canManage && (
                <TableHead className="w-12 pr-4">
                  <span className="sr-only">Actions</span>
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.map((client) => (
              <TableRow key={client.id}>
                <TableCell className="pl-4 font-medium">
                  <span className="block max-w-xs truncate">{client.name}</span>
                </TableCell>
                <TableCell className="hidden text-muted-foreground md:table-cell">
                  {client.email ?? "—"}
                </TableCell>
                <TableCell className="tabular-nums">{client.currency}</TableCell>
                <TableCell className="hidden text-muted-foreground lg:table-cell">
                  {client.createdLabel}
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
                            aria-label={`Actions for ${client.name}`}
                          />
                        }
                      >
                        <MoreHorizontal aria-hidden />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="min-w-40">
                        <DropdownMenuItem onClick={() => setEditing(client)}>
                          <Pencil aria-hidden />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toggleArchived(client)}>
                          {client.archivedAt ? (
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
        <ClientFormDialog
          open={editing !== null}
          onOpenChange={(open) => !open && setEditing(null)}
          client={editing ?? undefined}
          currencies={currencies}
          defaultCurrency={defaultCurrency}
        />
      )}
    </>
  );
}

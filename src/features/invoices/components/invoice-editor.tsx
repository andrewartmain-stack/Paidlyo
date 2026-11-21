"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowDown, ArrowLeft, ArrowUp, Eye, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FormError, FormField, TextareaField } from "@/components/form-field";
import { centsToInput } from "@/lib/form-schemas";
import { formatMoney, toCents } from "@/lib/money";
import { cn } from "@/lib/utils";
import { changeInvoiceStatus, deleteInvoice, saveInvoice } from "../actions";
import type { InvoiceFormInput, StatusAction } from "../schemas";
import { invoiceTotals, lineAmountCents } from "../totals";
import type { InvoiceDetail, InvoiceLine } from "../types";
import { AddTimeButton, AddTimeDialog } from "./add-time-dialog";
import { InvoiceStatusBadge } from "./invoice-status-badge";
import { PaymentsCard } from "./payments-card";
import { ShareLinkCard } from "./share-link-card";

type LineState = {
  /** Stable React key (server id, or a client id for new lines). */
  key: string;
  id: string;
  kind: InvoiceLine["kind"];
  description: string;
  quantity: string;
  unitPrice: string;
};

type FieldErrors = Record<string, string[] | undefined>;

let nextKey = 0;
function newLine(): LineState {
  nextKey += 1;
  return { key: `new-${nextKey}`, id: "", kind: "service", description: "", quantity: "1", unitPrice: "" };
}

function toLineState(line: InvoiceLine): LineState {
  return {
    key: line.id,
    id: line.id,
    kind: line.kind,
    description: line.description,
    quantity: String(line.quantity),
    unitPrice: centsToInput(line.unitPriceCents),
  };
}

/** Lenient parsing for the live preview; the server validates properly on save. */
function previewNumber(value: string): number {
  const n = Number(value.trim().replace(",", "."));
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : 0;
}
function previewCents(value: string): number {
  const cents = toCents(value.trim());
  return cents !== null && cents > 0 ? cents : 0;
}
function previewPercent(value: string): number {
  const n = previewNumber(value);
  return Math.min(n, 100);
}

export type EditorTimeOptions = {
  unbilledLabel: string | null;
  defaultFrom: string;
  defaultTo: string;
};

const NOTICES: Record<string, string> = {
  "no-time": "The draft was created, but there was no unbilled billable time for this client to add.",
  "time-error": "The draft was created, but adding unbilled time failed. Try Add unbilled time below.",
};

export function InvoiceEditor({
  invoice,
  time,
  notice,
  shareUrl,
  today,
}: {
  invoice: InvoiceDetail;
  time: EditorTimeOptions;
  /** Full client link (/i/<token>) for this invoice. */
  shareUrl: string;
  /** Today in the organization's timezone (default payment date). */
  today: string;
  /** Set after creating a draft when adding time didn't work. */
  notice?: string;
}) {
  const isDraft = invoice.status === "draft";
  const [dirty, setDirty] = useState(false);
  const [addTimeOpen, setAddTimeOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [lines, setLines] = useState<LineState[]>(() =>
    invoice.items.length > 0 ? invoice.items.map(toLineState) : [newLine()],
  );
  const [discountRate, setDiscountRate] = useState(String(invoice.discountRate));
  const [taxRate, setTaxRate] = useState(String(invoice.taxRate));
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [confirm, setConfirm] = useState<"void" | "delete" | null>(null);
  const [pending, startTransition] = useTransition();

  const totals = invoiceTotals(
    lines.map((l) => ({ quantity: previewNumber(l.quantity), unitPriceCents: previewCents(l.unitPrice) })),
    previewPercent(discountRate),
    previewPercent(taxRate),
  );
  const money = (cents: number) => formatMoney(cents, invoice.currency);

  function updateLine(key: string, patch: Partial<LineState>) {
    setDirty(true);
    setLines((current) => current.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  }
  function moveLine(index: number, delta: number) {
    setDirty(true);
    setLines((current) => {
      const next = [...current];
      const [line] = next.splice(index, 1);
      next.splice(index + delta, 0, line);
      return next;
    });
  }
  function removeLine(key: string) {
    setDirty(true);
    setLines((current) => current.filter((l) => l.key !== key));
  }

  function payload(): InvoiceFormInput {
    const data = new FormData(formRef.current ?? undefined);
    const text = (name: string) => String(data.get(name) ?? "");
    return {
      number: text("number"),
      issueDate: text("issueDate"),
      dueDate: text("dueDate"),
      subject: text("subject"),
      notes: text("notes"),
      discountRate,
      taxRate,
      // Blank trailing rows are ignored rather than reported as errors.
      items: lines
        .filter((l) => l.id || l.description.trim() || l.unitPrice.trim())
        .map((l) => ({ id: l.id, description: l.description, quantity: l.quantity, unitPrice: l.unitPrice })),
    };
  }

  /** Saves the draft; returns true on success. */
  async function save(): Promise<boolean> {
    const result = await saveInvoice(invoice.id, payload());
    if (result.ok) {
      setError(null);
      setFieldErrors({});
      return true;
    }
    setError(result.error);
    setFieldErrors(result.fieldErrors ?? {});
    return false;
  }

  function onSave() {
    startTransition(async () => {
      if (await save()) toast.success("Invoice saved");
    });
  }

  function onStatus(action: StatusAction) {
    if (action === "void" && confirm !== "void") {
      setConfirm("void");
      return;
    }
    startTransition(async () => {
      // Sending saves pending edits first so what's sent is what's on screen.
      if (action === "send" && !(await save())) return;
      const result = await changeInvoiceStatus(invoice.id, action);
      setConfirm(null);
      if (result.ok) {
        toast.success(
          action === "send" ? "Invoice marked as sent" : action === "revert" ? "Invoice is a draft again" : "Invoice voided",
        );
      } else {
        toast.error(result.error);
      }
    });
  }

  function onDelete() {
    if (confirm !== "delete") {
      setConfirm("delete");
      return;
    }
    startTransition(async () => {
      const result = await deleteInvoice(invoice.id);
      // Success redirects to the list.
      if (!result.ok) toast.error(result.error);
      setConfirm(null);
    });
  }

  const lineError = (index: number, field: string) => fieldErrors[`items.${index}.${field}`]?.[0];
  // Errors are indexed against the filtered list sent to the server.
  const sentIndex = new Map<string, number>();
  lines
    .filter((l) => l.id || l.description.trim() || l.unitPrice.trim())
    .forEach((l, i) => sentIndex.set(l.key, i));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <Link
            href="/app/invoices"
            className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Invoices
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl">Invoice {invoice.number}</h1>
            <InvoiceStatusBadge status={invoice.displayStatus} />
          </div>
          <p className="text-sm text-muted-foreground">
            {invoice.client.name} · {invoice.currency}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/app/invoices/${invoice.id}/preview`}
            className={buttonVariants({ variant: "outline" })}
            onClick={(e) => {
              // The preview shows the saved invoice.
              if (dirty) {
                e.preventDefault();
                toast.info("Save your changes first, then preview.");
              }
            }}
          >
            <Eye aria-hidden />
            Preview
          </Link>
          {isDraft && (
            <>
              <Button variant={confirm === "delete" ? "destructive" : "ghost"} disabled={pending} onClick={onDelete}>
                {confirm === "delete" ? "Click again to delete" : "Delete draft"}
              </Button>
              <Button variant="outline" disabled={pending} onClick={onSave}>
                {pending ? "Saving…" : "Save draft"}
              </Button>
              <Button disabled={pending} onClick={() => onStatus("send")}>
                Mark as sent
              </Button>
            </>
          )}
          {(invoice.status === "sent" || invoice.status === "partially_paid") && (
            <>
              {/* Invoices with payments can't be voided: delete the payments first. */}
              {invoice.amountPaidCents === 0 && (
                <Button
                  variant={confirm === "void" ? "destructive" : "ghost"}
                  disabled={pending}
                  onClick={() => onStatus("void")}
                >
                  {confirm === "void" ? "Click again to void" : "Void"}
                </Button>
              )}
              {invoice.amountPaidCents === 0 && (
                <Button variant="outline" disabled={pending} onClick={() => onStatus("revert")}>
                  Revert to draft
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {!isDraft && (
        <p className="rounded-lg bg-muted px-4 py-3 text-sm text-muted-foreground">
          {invoice.status === "void"
            ? "This invoice is void. It's kept for your records and can't be changed."
            : invoice.amountPaidCents > 0
              ? "This invoice has payments, so it's locked. To change it, delete its payments and revert it to a draft."
              : "This invoice has been sent, so it's locked. Revert it to a draft to make changes."}
        </p>
      )}

      {notice && NOTICES[notice] && (
        <p role="status" className="rounded-lg bg-warning/10 px-4 py-3 text-sm text-warning">
          {NOTICES[notice]}
        </p>
      )}

      {invoice.status !== "void" && <ShareLinkCard invoiceId={invoice.id} url={shareUrl} isDraft={isDraft} />}

      <FormError message={error} />

      <form
        ref={formRef}
        onInput={() => setDirty(true)}
        onSubmit={(e) => {
          e.preventDefault();
          if (isDraft) onSave();
        }}
        noValidate
      >
        <fieldset disabled={!isDraft || pending} className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <FormField name="number" label="Invoice number" defaultValue={invoice.number} errors={fieldErrors.number} />
              <FormField
                name="issueDate"
                label="Issue date"
                type="date"
                defaultValue={invoice.issueDate}
                errors={fieldErrors.issueDate}
              />
              <FormField
                name="dueDate"
                label="Due date"
                type="date"
                defaultValue={invoice.dueDate}
                errors={fieldErrors.dueDate}
              />
              <FormField
                name="subject"
                label="Subject"
                placeholder="Optional, e.g. November website work"
                defaultValue={invoice.subject ?? ""}
                errors={fieldErrors.subject}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Line items</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {fieldErrors.items?.[0] && <p className="text-sm text-destructive">{fieldErrors.items[0]}</p>}
              <div className="hidden grid-cols-[1fr_6rem_8rem_8rem_5.5rem] gap-3 px-1 text-xs font-medium text-muted-foreground md:grid">
                <span>Description</span>
                <span className="text-right">Quantity</span>
                <span className="text-right">Unit price</span>
                <span className="text-right">Amount</span>
                <span className="sr-only">Actions</span>
              </div>
              <ul className="flex flex-col gap-3">
                {lines.map((line, index) => {
                  const i = sentIndex.get(line.key) ?? -1;
                  const errors = {
                    description: lineError(i, "description"),
                    quantity: lineError(i, "quantity"),
                    unitPrice: lineError(i, "unitPrice"),
                  };
                  const amount = lineAmountCents(previewNumber(line.quantity), previewCents(line.unitPrice));
                  return (
                    <li
                      key={line.key}
                      className="grid grid-cols-2 gap-3 rounded-lg border p-3 md:grid-cols-[1fr_6rem_8rem_8rem_5.5rem] md:items-start md:border-0 md:p-0"
                    >
                      <div className="col-span-2 flex flex-col gap-1 md:col-span-1">
                        <div className="flex items-center gap-2">
                          <Input
                            aria-label={`Line ${index + 1} description`}
                            value={line.description}
                            onChange={(e) => updateLine(line.key, { description: e.target.value })}
                            placeholder="Description"
                            aria-invalid={errors.description ? true : undefined}
                          />
                          {line.kind === "time" && <Badge variant="secondary">Time</Badge>}
                        </div>
                        {errors.description && <span className="text-xs text-destructive">{errors.description}</span>}
                      </div>
                      <div className="flex flex-col gap-1">
                        <Input
                          aria-label={`Line ${index + 1} quantity`}
                          inputMode="decimal"
                          value={line.quantity}
                          onChange={(e) => updateLine(line.key, { quantity: e.target.value })}
                          className="text-right tabular-nums"
                          aria-invalid={errors.quantity ? true : undefined}
                        />
                        {errors.quantity && <span className="text-xs text-destructive">{errors.quantity}</span>}
                      </div>
                      <div className="flex flex-col gap-1">
                        <Input
                          aria-label={`Line ${index + 1} unit price (${invoice.currency})`}
                          inputMode="decimal"
                          placeholder="0.00"
                          value={line.unitPrice}
                          onChange={(e) => updateLine(line.key, { unitPrice: e.target.value })}
                          className="text-right tabular-nums"
                          aria-invalid={errors.unitPrice ? true : undefined}
                        />
                        {errors.unitPrice && <span className="text-xs text-destructive">{errors.unitPrice}</span>}
                      </div>
                      <span className="flex h-9 items-center text-sm font-medium tabular-nums md:justify-end">
                        {money(amount)}
                      </span>
                      {isDraft && (
                        <div className="flex h-9 items-center justify-end gap-0.5">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Move line ${index + 1} up`}
                            disabled={index === 0}
                            onClick={() => moveLine(index, -1)}
                          >
                            <ArrowUp aria-hidden />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Move line ${index + 1} down`}
                            disabled={index === lines.length - 1}
                            onClick={() => moveLine(index, 1)}
                          >
                            <ArrowDown aria-hidden />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Remove line ${index + 1}`}
                            onClick={() => removeLine(line.key)}
                          >
                            <Trash2 aria-hidden />
                          </Button>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
              {isDraft && (
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-fit"
                    onClick={() => {
                      setDirty(true);
                      setLines((current) => [...current, newLine()]);
                    }}
                  >
                    <Plus aria-hidden />
                    Add line
                  </Button>
                  <AddTimeButton
                    disabled={pending}
                    onClick={() => {
                      // Adding time reloads the invoice, which would drop unsaved edits.
                      if (dirty) toast.info("Save your changes first, then add unbilled time.");
                      else setAddTimeOpen(true);
                    }}
                  />
                </div>
              )}

              <dl className="ml-auto flex w-full max-w-sm flex-col gap-2 border-t pt-4 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Subtotal</dt>
                  <dd className="tabular-nums">{money(totals.subtotalCents)}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="flex items-center gap-2 text-muted-foreground">
                    Discount
                    <PercentInput label="Discount percentage" value={discountRate} onChange={(v) => { setDirty(true); setDiscountRate(v); }} invalid={!!fieldErrors.discountRate} />
                  </dt>
                  <dd className="tabular-nums">−{money(totals.discountCents)}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="flex items-center gap-2 text-muted-foreground">
                    Tax
                    <PercentInput label="Tax percentage" value={taxRate} onChange={(v) => { setDirty(true); setTaxRate(v); }} invalid={!!fieldErrors.taxRate} />
                  </dt>
                  <dd className="tabular-nums">{money(totals.taxCents)}</dd>
                </div>
                {(fieldErrors.discountRate || fieldErrors.taxRate) && (
                  <p className="text-xs text-destructive">
                    {fieldErrors.discountRate?.[0] ?? fieldErrors.taxRate?.[0]}
                  </p>
                )}
                <div className="flex justify-between border-t pt-3 text-base font-semibold">
                  <dt>Total</dt>
                  <dd className="font-heading tabular-nums">{money(totals.totalCents)}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <TextareaField
                name="notes"
                label="Notes for the client"
                hint="Shown on the invoice, e.g. payment instructions or bank details."
                rows={4}
                defaultValue={invoice.notes ?? ""}
                errors={fieldErrors.notes}
              />
            </CardContent>
          </Card>
        </fieldset>
      </form>

      {(invoice.status === "sent" || invoice.status === "partially_paid" || invoice.status === "paid") && (
        <PaymentsCard invoice={invoice} today={today} />
      )}

      {isDraft && (
        <AddTimeDialog
          open={addTimeOpen}
          onOpenChange={setAddTimeOpen}
          invoiceId={invoice.id}
          clientName={invoice.client.name}
          unbilledLabel={time.unbilledLabel}
          defaultFrom={time.defaultFrom}
          defaultTo={time.defaultTo}
        />
      )}
    </div>
  );
}

function PercentInput({
  label,
  value,
  onChange,
  invalid,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  invalid: boolean;
}) {
  return (
    <span className="relative">
      <Input
        aria-label={label}
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={invalid ? true : undefined}
        className={cn("h-8 w-20 pr-6 text-right tabular-nums")}
      />
      <span aria-hidden className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground">
        %
      </span>
    </span>
  );
}

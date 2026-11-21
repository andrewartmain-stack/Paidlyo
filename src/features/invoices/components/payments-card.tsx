"use client";

import { useState, useTransition } from "react";
import { Banknote, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormError, FormField, SelectField, TextareaField } from "@/components/form-field";
import { useFormAction } from "@/hooks/use-form-action";
import { centsToInput } from "@/lib/form-schemas";
import { formatMoney } from "@/lib/money";
import { formatDate } from "@/features/time/dates";
import { deletePayment, recordPayment } from "../actions";
import { balanceDueCents } from "../document";
import { MANUAL_PAYMENT_METHODS, PAYMENT_METHOD_LABELS } from "../payments";
import type { InvoiceDetail } from "../types";

const METHOD_OPTIONS = MANUAL_PAYMENT_METHODS.map((value) => ({ value, label: PAYMENT_METHOD_LABELS[value] }));

/**
 * Payments of a sent / paid invoice. Render it outside the editor's <form>: the dialog's form
 * would otherwise bubble its submit to the editor (see AddTimeDialog).
 */
export function PaymentsCard({ invoice, today }: { invoice: InvoiceDetail; today: string }) {
  const [open, setOpen] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const money = (cents: number) => formatMoney(cents, invoice.currency);
  const due = balanceDueCents(invoice.totalCents, invoice.amountPaidCents);
  const canChange = invoice.status !== "void";

  function remove(paymentId: string) {
    if (confirmId !== paymentId) {
      setConfirmId(paymentId);
      return;
    }
    startTransition(async () => {
      const result = await deletePayment(invoice.id, paymentId);
      setConfirmId(null);
      if (result.ok) toast.success("Payment deleted");
      else toast.error(result.error);
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1.5">
          <CardTitle className="text-lg font-semibold">Payments</CardTitle>
          <CardDescription>
            {invoice.status === "paid" ? "Paid in full." : `Amount due: ${money(due)}`}
          </CardDescription>
        </div>
        {canChange && due > 0 && (
          <Button type="button" onClick={() => setOpen(true)}>
            <Banknote aria-hidden />
            Record payment
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {invoice.payments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No payments recorded yet.</p>
        ) : (
          <ul className="flex flex-col divide-y text-sm">
            {invoice.payments.map((payment) => (
              <li key={payment.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-2.5">
                <span className="w-28 shrink-0">{formatDate(payment.paidAt)}</span>
                <span className="text-muted-foreground">{PAYMENT_METHOD_LABELS[payment.method]}</span>
                {payment.notes && <span className="min-w-0 flex-1 truncate text-muted-foreground">{payment.notes}</span>}
                <span className="ml-auto font-medium tabular-nums">{money(payment.amountCents)}</span>
                {canChange && (
                  <Button
                    type="button"
                    size="sm"
                    variant={confirmId === payment.id ? "destructive" : "ghost"}
                    disabled={pending}
                    onClick={() => remove(payment.id)}
                    onBlur={() => setConfirmId(null)}
                    aria-label={confirmId === payment.id ? "Click again to delete this payment" : "Delete payment"}
                  >
                    <Trash2 aria-hidden />
                    {confirmId === payment.id && "Click again"}
                  </Button>
                )}
              </li>
            ))}
            <li className="flex items-center justify-between py-2.5 font-medium">
              <span>Total paid</span>
              <span className="tabular-nums">{money(invoice.amountPaidCents)}</span>
            </li>
          </ul>
        )}
      </CardContent>

      {canChange && due > 0 && (
        <RecordPaymentDialog
          open={open}
          onOpenChange={setOpen}
          invoiceId={invoice.id}
          number={invoice.number}
          dueLabel={money(due)}
          defaultAmount={centsToInput(due)}
          today={today}
        />
      )}
    </Card>
  );
}

function RecordPaymentDialog({
  open,
  onOpenChange: setOpen,
  invoiceId,
  number,
  dueLabel,
  defaultAmount,
  today,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: string;
  number: string;
  dueLabel: string;
  defaultAmount: string;
  today: string;
}) {
  const { onSubmit, pending, error, fieldErrors } = useFormAction(async (formData: FormData) => {
    const result = await recordPayment(invoiceId, formData);
    if (result.ok) {
      toast.success("Payment recorded");
      setOpen(false);
    }
    return result;
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="gap-6 p-6 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg">Record payment</DialogTitle>
          <DialogDescription>
            Invoice {number} · {dueLabel} due
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-6" noValidate>
          <FormError message={error} />
          <fieldset disabled={pending} className="grid gap-5 sm:grid-cols-2">
            <FormField
              name="amount"
              label="Amount"
              inputMode="decimal"
              defaultValue={defaultAmount}
              errors={fieldErrors.amount}
            />
            <FormField name="paidAt" label="Date paid" type="date" defaultValue={today} max={today} errors={fieldErrors.paidAt} />
            <div className="sm:col-span-2">
              <SelectField
                name="method"
                label="Method"
                options={METHOD_OPTIONS}
                defaultValue="bank_transfer"
                errors={fieldErrors.method}
              />
            </div>
            <div className="sm:col-span-2">
              <TextareaField
                name="notes"
                label="Notes"
                placeholder="Optional, e.g. a transfer reference"
                rows={2}
                errors={fieldErrors.notes}
              />
            </div>
          </fieldset>
          <DialogFooter className="-mx-6 -mb-6 px-6">
            <DialogClose render={<Button type="button" variant="outline" disabled={pending} />}>
              Cancel
            </DialogClose>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Record payment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { FormError, FormField, SelectField, type SelectOption } from "@/components/form-field";
import { useFormAction } from "@/hooks/use-form-action";
import { formatDate } from "@/features/time/dates";
import { createInvoice } from "../actions";
import { PAYMENT_TERMS, dueDateForTerm, type PaymentTerm } from "../terms";
import { UnbilledTimeFields } from "./unbilled-time-fields";

export function NewInvoiceForm({
  clients,
  unbilled,
  today,
  defaultClientId,
  defaultSource = "blank",
}: {
  clients: SelectOption[];
  /** Client id → "12:30 unbilled (≈ $1,500.00)". */
  unbilled: Record<string, string>;
  today: string;
  /** Preselected from the URL (already checked to be an active client). */
  defaultClientId?: string;
  defaultSource?: "blank" | "time";
}) {
  const { onSubmit, pending, error, fieldErrors } = useFormAction(createInvoice);
  const [clientId, setClientId] = useState(defaultClientId ?? "");
  const [source, setSource] = useState<"blank" | "time">(defaultSource);
  const clientUnbilled = clientId ? unbilled[clientId] : undefined;
  const [issueDate, setIssueDate] = useState(today);
  const [terms, setTerms] = useState<PaymentTerm>("net30");
  const presetDue = dueDateForTerm(issueDate || today, terms);

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6" noValidate>
      <FormError message={error} />
      <fieldset disabled={pending} className="flex flex-col gap-5">
        <SelectField
          name="clientId"
          label="Client"
          options={clients}
          defaultValue={defaultClientId}
          onValueChange={setClientId}
          hint={clientId ? (clientUnbilled ?? "No unbilled billable time") : undefined}
          errors={fieldErrors.clientId}
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField
            name="issueDate"
            label="Issue date"
            type="date"
            value={issueDate}
            onChange={(e) => setIssueDate(e.target.value)}
            errors={fieldErrors.issueDate}
          />
          <SelectField
            name="terms"
            label="Payment terms"
            options={PAYMENT_TERMS.map((t) => ({ value: t.value, label: t.label }))}
            defaultValue={terms}
            onValueChange={(v) => setTerms(PAYMENT_TERMS.find((t) => t.value === v)?.value ?? "net30")}
            errors={fieldErrors.terms}
          />
        </div>
        {terms === "custom" ? (
          <FormField
            name="dueDate"
            label="Due date"
            type="date"
            min={issueDate}
            defaultValue={issueDate}
            errors={fieldErrors.dueDate}
            className="sm:max-w-[calc(50%-0.625rem)]"
          />
        ) : (
          presetDue && (
            <p className="text-sm text-muted-foreground">
              Due on <span className="font-medium text-foreground">{formatDate(presetDue)}</span>
            </p>
          )
        )}
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1.5 text-sm font-medium">Start with</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {(
              [
                ["blank", "Blank invoice", "Add line items yourself."],
                ["time", "Unbilled time", "Turn tracked billable hours into lines."],
              ] as const
            ).map(([value, label, hint]) => (
              <label
                key={value}
                className={
                  "flex cursor-pointer gap-2.5 rounded-lg border bg-card p-3 text-sm transition-colors hover:bg-accent has-focus-visible:ring-2 has-focus-visible:ring-ring " +
                  (source === value ? "border-brand bg-accent" : "")
                }
              >
                <input
                  type="radio"
                  name="source"
                  value={value}
                  checked={source === value}
                  onChange={() => setSource(value)}
                  className="mt-0.5 size-4 shrink-0 accent-primary"
                />
                <span className="flex flex-col gap-0.5">
                  <span className="font-medium">{label}</span>
                  <span className="text-muted-foreground">{hint}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        {source === "time" && (
          <UnbilledTimeFields fieldErrors={fieldErrors} defaultFrom={`${today.slice(0, 8)}01`} defaultTo={today} />
        )}
      </fieldset>
      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Creating…" : "Create draft"}
        </Button>
        <Link href="/app/invoices" className={buttonVariants({ variant: "outline" })}>
          Cancel
        </Link>
      </div>
    </form>
  );
}

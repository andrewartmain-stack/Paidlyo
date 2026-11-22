"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FormError, FormField, SelectField, TextareaField } from "@/components/form-field";
import { useFormAction } from "@/hooks/use-form-action";
import { centsToInput } from "@/lib/form-schemas";
import { cn } from "@/lib/utils";
import type { Task } from "@/features/tasks/types";
import { saveProject } from "../actions";
import { BILLING_METHOD_LABELS } from "../format";
import { minutesToHours, type BudgetKind } from "../schemas";
import { BILLING_METHODS, type ProjectDetail, type SelectableBillingMethod } from "../types";

export type ProjectFormClient = { id: string; name: string; currency: string };

const BILLING_HINTS: Record<SelectableBillingMethod, string> = {
  project_rate: "One hourly rate for all work on this project.",
  task_rate: "Each task has its own rate; defaults come from the task.",
  person_rate: "Each person's own rate, set on the Team page.",
  none: "Time is tracked but never invoiced.",
};

const BUDGET_OPTIONS: { value: BudgetKind; label: string }[] = [
  { value: "none", label: "No budget" },
  { value: "hours", label: "Total hours" },
  { value: "amount", label: "Total amount" },
];

function initialBudgetKind(project?: ProjectDetail): BudgetKind {
  if (project?.budgetMinutes != null) return "hours";
  if (project?.budgetCents != null) return "amount";
  return "none";
}

function initialBillingMethod(project?: ProjectDetail): SelectableBillingMethod {
  return project?.billingMethod ?? "project_rate";
}

export function ProjectForm({
  project,
  clients,
  tasks,
  peopleWithoutRate,
}: {
  /** Edit this project; omit to create one. */
  project?: ProjectDetail;
  clients: ProjectFormClient[];
  tasks: Task[];
  /** Active team members with no billable rate yet (for the person-rate warning). */
  peopleWithoutRate: number;
}) {
  const router = useRouter();
  const [clientId, setClientId] = useState(project?.clientId ?? "");
  const [billingMethod, setBillingMethod] = useState(initialBillingMethod(project));
  const [budgetKind, setBudgetKind] = useState(initialBudgetKind(project));
  const [included, setIncluded] = useState<Set<string>>(
    () =>
      new Set(project ? project.tasks.map((t) => t.taskId) : tasks.filter((t) => t.isCommon).map((t) => t.id)),
  );

  const currency = clients.find((c) => c.id === clientId)?.currency;
  const currencySuffix = currency ? ` (${currency})` : "";
  const settings = new Map(project?.tasks.map((t) => [t.taskId, t]));

  const { onSubmit, pending, error, fieldErrors } = useFormAction(async (formData: FormData) => {
    const result = await saveProject(project?.id ?? null, formData);
    if (result.ok) {
      toast.success(project ? "Project saved" : "Project created");
      router.push("/app/projects");
    }
    return result;
  });

  function toggleTask(taskId: string, checked: boolean) {
    setIncluded((current) => {
      const next = new Set(current);
      if (checked) next.add(taskId);
      else next.delete(taskId);
      return next;
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6" noValidate>
      <FormError message={error} />
      <fieldset disabled={pending} className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5 md:grid-cols-2">
            <SelectField
              name="clientId"
              label="Client"
              options={clients.map((c) => ({ value: c.id, label: c.name }))}
              defaultValue={project?.clientId}
              onValueChange={setClientId}
              errors={fieldErrors.clientId}
            />
            <FormField
              name="name"
              label="Project name"
              defaultValue={project?.name}
              required
              errors={fieldErrors.name}
            />
            <FormField
              name="code"
              label="Project code"
              hint="Optional, e.g. ACME-01."
              defaultValue={project?.code ?? ""}
              errors={fieldErrors.code}
            />
            <TextareaField
              name="notes"
              label="Notes"
              hint="Optional. Only visible to your team."
              rows={3}
              defaultValue={project?.notes ?? ""}
              errors={fieldErrors.notes}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Billing</CardTitle>
            <CardDescription>How time on this project turns into invoice amounts.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <RadioCards
              name="billingMethod"
              legend="Billing method"
              value={billingMethod}
              onChange={setBillingMethod}
              options={BILLING_METHODS.map((m) => ({
                value: m,
                label: BILLING_METHOD_LABELS[m],
                hint: BILLING_HINTS[m],
              }))}
            />
            {billingMethod === "project_rate" && (
              <FormField
                name="hourlyRate"
                label={`Hourly rate${currencySuffix}`}
                inputMode="decimal"
                placeholder="0.00"
                defaultValue={centsToInput(project?.hourlyRateCents ?? null)}
                errors={fieldErrors.hourlyRate}
                className="max-w-48"
              />
            )}
            {billingMethod === "person_rate" && peopleWithoutRate > 0 && (
              <p role="status" className="rounded-lg bg-warning/10 px-4 py-3 text-sm">
                {peopleWithoutRate === 1 ? "1 person has" : `${peopleWithoutRate} people have`} no billable rate
                yet, so their time here won&apos;t have an amount.{" "}
                <Link href="/app/team" className="font-medium text-brand underline-offset-4 hover:underline">
                  Set rates on the Team page
                </Link>
              </p>
            )}

            <RadioCards
              name="budgetKind"
              legend="Budget"
              value={budgetKind}
              onChange={setBudgetKind}
              options={BUDGET_OPTIONS}
            />
            {budgetKind === "hours" && (
              <FormField
                name="budgetHours"
                label="Budget (hours)"
                inputMode="decimal"
                placeholder="40"
                defaultValue={project?.budgetMinutes ? minutesToHours(project.budgetMinutes) : ""}
                errors={fieldErrors.budgetHours}
                className="max-w-48"
              />
            )}
            {budgetKind === "amount" && (
              <FormField
                name="budgetAmount"
                label={`Budget amount${currencySuffix}`}
                inputMode="decimal"
                placeholder="0.00"
                defaultValue={centsToInput(project?.budgetCents ?? null)}
                errors={fieldErrors.budgetAmount}
                className="max-w-48"
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Tasks</CardTitle>
            <CardDescription>
              The tasks people can track time against on this project.{" "}
              <Link href="/app/tasks" className="text-brand underline-offset-4 hover:underline">
                Manage tasks
              </Link>
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {fieldErrors.tasks?.[0] && (
              <p role="alert" className="text-sm text-destructive">
                {fieldErrors.tasks[0]}
              </p>
            )}
            {tasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                You have no tasks yet.{" "}
                <Link href="/app/tasks" className="text-brand underline-offset-4 hover:underline">
                  Add tasks
                </Link>{" "}
                first, then come back to this project.
              </p>
            ) : (
              <ul className="divide-y rounded-lg border">
                {tasks.map((task) => {
                  const isIncluded = included.has(task.id);
                  const setting = settings.get(task.id);
                  const rateError = fieldErrors[`rate:${task.id}`]?.[0];
                  return (
                    <li key={task.id} className="flex flex-wrap items-center gap-x-6 gap-y-2 px-3 py-2.5">
                      <label className="flex min-w-48 flex-1 items-center gap-2.5 text-sm font-medium">
                        <input
                          type="checkbox"
                          name="taskIds"
                          value={task.id}
                          checked={isIncluded}
                          onChange={(e) => toggleTask(task.id, e.target.checked)}
                          className="size-4 accent-primary"
                        />
                        {task.name}
                        {task.archivedAt && <Badge variant="secondary">Archived</Badge>}
                      </label>
                      {billingMethod !== "none" && (
                        <label
                          className={cn(
                            "flex items-center gap-2 text-sm text-muted-foreground",
                            !isIncluded && "opacity-50",
                          )}
                        >
                          <input
                            type="checkbox"
                            name={`billable:${task.id}`}
                            defaultChecked={setting?.isBillable ?? task.isBillable}
                            disabled={!isIncluded}
                            className="size-4 accent-primary"
                          />
                          Billable
                        </label>
                      )}
                      {billingMethod === "task_rate" && (
                        <div className="flex flex-col gap-1">
                          <Input
                            name={`rate:${task.id}`}
                            aria-label={`Hourly rate for ${task.name}${currencySuffix}`}
                            inputMode="decimal"
                            disabled={!isIncluded}
                            placeholder={
                              task.defaultHourlyRateCents !== null
                                ? `${centsToInput(task.defaultHourlyRateCents)} default`
                                : "Rate"
                            }
                            defaultValue={centsToInput(setting?.hourlyRateCents ?? null)}
                            aria-invalid={rateError ? true : undefined}
                            className="h-8 w-36"
                          />
                          {rateError && <span className="text-xs text-destructive">{rateError}</span>}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </fieldset>

      <div className="flex justify-end gap-2">
        <Link href="/app/projects" className={buttonVariants({ variant: "outline" })}>
          Cancel
        </Link>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : project ? "Save project" : "Create project"}
        </Button>
      </div>
    </form>
  );
}

function RadioCards<T extends string>({
  name,
  legend,
  value,
  onChange,
  options,
}: {
  name: string;
  legend: string;
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string; hint?: string }[];
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1.5 text-sm font-medium">{legend}</legend>
      <div className={cn("grid gap-2", options.length === 4 ? "sm:grid-cols-2 xl:grid-cols-4" : "sm:grid-cols-3")}>
        {options.map((option) => (
          <label
            key={option.value}
            className={cn(
              "flex cursor-pointer gap-2.5 rounded-lg border bg-card p-3 text-sm transition-colors hover:bg-accent has-focus-visible:ring-2 has-focus-visible:ring-ring",
              value === option.value && "border-brand bg-accent",
            )}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="mt-0.5 size-4 shrink-0 accent-primary"
            />
            <span className="flex flex-col gap-0.5">
              <span className="font-medium">{option.label}</span>
              {option.hint && <span className="text-muted-foreground">{option.hint}</span>}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

"use client";

import { useState } from "react";
import { FormField } from "@/components/form-field";
import { cn } from "@/lib/utils";
import { TIME_GROUPINGS, type TimeGrouping } from "../schemas";

/** Period + grouping fields for adding unbilled time (new invoice form and editor dialog). */
export function UnbilledTimeFields({
  fieldErrors,
  defaultFrom,
  defaultTo,
}: {
  fieldErrors: Record<string, string[] | undefined>;
  defaultFrom: string;
  defaultTo: string;
}) {
  const [period, setPeriod] = useState<"all" | "range">("all");
  const [grouping, setGrouping] = useState<TimeGrouping>("task");

  return (
    <div className="flex flex-col gap-5">
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1.5 text-sm font-medium">Period</legend>
        <div className="flex flex-wrap gap-4">
          {(
            [
              ["all", "All unbilled time"],
              ["range", "Date range"],
            ] as const
          ).map(([value, label]) => (
            <label key={value} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="period"
                value={value}
                checked={period === value}
                onChange={() => setPeriod(value)}
                className="size-4 accent-primary"
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>
      {period === "range" && (
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField name="from" label="From" type="date" defaultValue={defaultFrom} errors={fieldErrors.from} />
          <FormField name="to" label="To" type="date" defaultValue={defaultTo} errors={fieldErrors.to} />
        </div>
      )}
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1.5 text-sm font-medium">Group time into lines</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {TIME_GROUPINGS.map((option) => (
            <label
              key={option.value}
              className={cn(
                "flex cursor-pointer gap-2.5 rounded-lg border bg-card p-3 text-sm transition-colors hover:bg-accent has-focus-visible:ring-2 has-focus-visible:ring-ring",
                grouping === option.value && "border-brand bg-accent",
              )}
            >
              <input
                type="radio"
                name="grouping"
                value={option.value}
                checked={grouping === option.value}
                onChange={() => setGrouping(option.value)}
                className="mt-0.5 size-4 shrink-0 accent-primary"
              />
              <span className="flex flex-col gap-0.5">
                <span className="font-medium">{option.label}</span>
                <span className="text-muted-foreground">{option.hint}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  );
}

import { cn } from "@/lib/utils";
import { budgetDetail, budgetLabel, type BudgetProgress } from "../budget";

const BAR_COLOR = { ok: "bg-success", warning: "bg-warning", over: "bg-destructive" } as const;
const TEXT_COLOR = { ok: "text-muted-foreground", warning: "text-warning", over: "text-destructive" } as const;

/** Budget used as a bar with "32 of 40 h · 80% used" (green, amber from 80%, red when over). */
export function BudgetBar({
  progress,
  currency,
  className,
}: {
  progress: BudgetProgress;
  currency: string;
  className?: string;
}) {
  const label = budgetLabel(progress, currency);
  const detail = budgetDetail(progress, currency);
  return (
    <div className={cn("flex min-w-40 flex-col gap-1", className)}>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.min(progress.pct, 100)}
        aria-valuetext={`${label}, ${detail}`}
        className="h-1.5 overflow-hidden rounded-full bg-muted"
      >
        <div
          className={cn("h-full rounded-full", BAR_COLOR[progress.status])}
          style={{ width: `${Math.min(progress.pct, 100)}%` }}
        />
      </div>
      <p className="flex flex-wrap justify-between gap-x-2 text-xs tabular-nums">
        <span className="text-foreground">{label}</span>
        <span className={cn(progress.status !== "ok" && "font-medium", TEXT_COLOR[progress.status])}>{detail}</span>
      </p>
    </div>
  );
}

import { cn } from "@/lib/utils";

const TONES = {
  neutral: "bg-muted text-foreground",
  success: "bg-accent text-success",
  warning: "bg-warning/10 text-warning",
  danger: "bg-destructive/10 text-destructive",
} as const;

export function StatusChip({ tone, children, className }: { tone: keyof typeof TONES; children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex h-5 items-center rounded-full px-2 text-[10px] font-medium whitespace-nowrap", TONES[tone], className)}>
      {children}
    </span>
  );
}

/** Small bordered stat card as on the app's dashboard and reports. */
export function StatCard({ label, value, hint, className }: { label: string; value: string; hint: string; className?: string }) {
  return (
    <div className={cn("rounded-xl border bg-card p-3 transition-colors hover:border-input", className)}>
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="mt-1 font-heading text-lg leading-none font-semibold tracking-tight tabular-nums">{value}</p>
      <p className="mt-1.5 text-[10px] text-muted-foreground">{hint}</p>
    </div>
  );
}

/** Pill button shared by interactive mocks. Real <button>, visible focus ring. */
export const mockButton =
  "inline-flex h-7 items-center justify-center gap-1.5 rounded-full border bg-background px-3 text-[11px] font-medium whitespace-nowrap outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-60";
export const mockButtonPrimary =
  "inline-flex h-7 items-center justify-center gap-1.5 rounded-full bg-primary px-3 text-[11px] font-medium whitespace-nowrap text-primary-foreground outline-none transition-colors hover:bg-primary-hover focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-60";

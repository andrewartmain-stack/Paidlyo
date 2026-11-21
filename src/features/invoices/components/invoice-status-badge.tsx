import { Badge } from "@/components/ui/badge";
import type { DisplayStatus } from "../types";

const STATUS: Record<DisplayStatus, { label: string; variant: "secondary" | "outline" | "success" | "warning" | "destructive" }> = {
  draft: { label: "Draft", variant: "secondary" },
  sent: { label: "Sent", variant: "outline" },
  overdue: { label: "Overdue", variant: "destructive" },
  partially_paid: { label: "Partly paid", variant: "warning" },
  paid: { label: "Paid", variant: "success" },
  void: { label: "Void", variant: "secondary" },
};

export function InvoiceStatusBadge({ status }: { status: DisplayStatus }) {
  const { label, variant } = STATUS[status];
  return (
    <Badge variant={variant} className={status === "void" ? "line-through" : undefined}>
      {label}
    </Badge>
  );
}

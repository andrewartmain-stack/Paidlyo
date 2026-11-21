import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDuration } from "@/features/time/duration";
import { formatMoneyTotals, percentOf, type ReportSummary as Summary } from "../aggregate";

/** Total hours, billable hours, billable amount and unbilled amount for the period. */
export function ReportSummary({ summary, currency }: { summary: Summary; currency: string }) {
  const nonBillable = summary.minutes - summary.billableMinutes;
  const cards = [
    { label: "Total hours", value: formatDuration(summary.minutes), detail: `${formatDuration(nonBillable)} non-billable` },
    {
      label: "Billable hours",
      value: formatDuration(summary.billableMinutes),
      detail: `${percentOf(summary.billableMinutes, summary.minutes)}% of total`,
    },
    { label: "Billable amount", value: formatMoneyTotals(summary.billableAmount, currency), detail: "Hours × rates" },
    {
      label: "Unbilled amount",
      value: formatMoneyTotals(summary.unbilledAmount, currency),
      detail: "Billable time not on an invoice",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardHeader className="gap-1">
            <CardDescription>{card.label}</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums">{card.value}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">{card.detail}</CardContent>
        </Card>
      ))}
    </div>
  );
}

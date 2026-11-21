/**
 * Illustration of the app (a timesheet and an invoice) built in HTML, so it's sharp at any size
 * and costs no image download. Decorative: the real content is in the text around it.
 */
const WEEK = [
  { project: "Website redesign", client: "Northwind", hours: ["2:30", "4:00", "3:15", "5:00", "1:45"] },
  { project: "Brand guidelines", client: "Lumen Studio", hours: ["3:00", "", "2:00", "1:30", "4:15"] },
  { project: "Support retainer", client: "Acme Co", hours: ["0:45", "1:15", "", "0:30", "1:00"] },
];

const LINES = [
  { description: "Website redesign · Design", amount: "$1,875.00" },
  { description: "Website redesign · Development", amount: "$2,400.00" },
  { description: "Support retainer", amount: "$262.50" },
];

export function ProductPreview() {
  return (
    <div aria-hidden className="relative mx-auto w-full max-w-5xl select-none">
      <div className="overflow-hidden rounded-2xl border bg-card shadow-[0_24px_60px_-30px_rgb(14_15_12/0.35)]">
        <div className="flex items-center gap-1.5 border-b bg-muted/60 px-4 py-3">
          <span className="size-2.5 rounded-full bg-input" />
          <span className="size-2.5 rounded-full bg-input" />
          <span className="size-2.5 rounded-full bg-input" />
          <span className="ml-3 text-xs text-muted-foreground">Timesheet · This week</span>
        </div>
        <div className="overflow-x-auto p-4 sm:p-6">
          <table className="w-full min-w-[34rem] text-left text-sm">
            <thead>
              <tr className="text-xs text-muted-foreground">
                <th className="pb-3 font-medium">Project</th>
                {["Mon", "Tue", "Wed", "Thu", "Fri"].map((day) => (
                  <th key={day} className="pb-3 text-right font-medium">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {WEEK.map((row) => (
                <tr key={row.project}>
                  <td className="py-3">
                    <div className="font-medium">{row.project}</div>
                    <div className="text-xs text-muted-foreground">{row.client}</div>
                  </td>
                  {row.hours.map((h, i) => (
                    <td key={i} className="py-3 text-right tabular-nums">
                      {h ? (
                        <span className="rounded-md border bg-background px-2 py-1">{h}</span>
                      ) : (
                        <span className="text-faint-foreground">–</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="relative -mt-10 ml-auto w-[88%] max-w-sm rounded-2xl border bg-card p-5 shadow-[0_24px_60px_-30px_rgb(14_15_12/0.45)] sm:absolute sm:-right-4 sm:-bottom-10 sm:mt-0 lg:-right-10">
        <div className="flex items-center justify-between">
          <span className="font-heading text-base font-bold">INV-0042</span>
          <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground">Paid</span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">Northwind · Due 30 Nov</p>
        <ul className="mt-4 flex flex-col gap-2 text-sm">
          {LINES.map((line) => (
            <li key={line.description} className="flex justify-between gap-3">
              <span className="truncate text-muted-foreground">{line.description}</span>
              <span className="tabular-nums">{line.amount}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex justify-between border-t pt-3 text-sm font-semibold">
          <span>Total</span>
          <span className="tabular-nums">$4,537.50</span>
        </div>
      </div>
    </div>
  );
}

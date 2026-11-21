import type { NextRequest } from "next/server";
import { canManageOrg, findCurrentOrg } from "@/features/organizations/queries";
import type { CurrentOrg } from "@/features/organizations/types";
import { outstandingCsv, timeEntriesCsv, unbilledCsv } from "@/features/reports/csv";
import { toOutstanding } from "@/features/reports/outstanding";
import { resolveReportRange } from "@/features/reports/periods";
import { MAX_REPORT_ENTRIES, listOpenInvoices, listReportEntries, listUnbilledEntries } from "@/features/reports/queries";
import { reportFiltersSchema, reportKindSchema } from "@/features/reports/schemas";
import { groupUnbilled } from "@/features/reports/unbilled";
import { todayIn } from "@/features/time/dates";

type Csv = { body: string; filename: string } | null;

async function buildCsv(org: CurrentOrg, params: Record<string, string>): Promise<Csv> {
  const today = todayIn(org.timezone);
  switch (reportKindSchema.parse(params.report)) {
    case "time": {
      const range = resolveReportRange(reportFiltersSchema.parse(params), today);
      const { entries, truncated } = await listReportEntries(org, range);
      return truncated ? null : { body: timeEntriesCsv(entries), filename: `paidlyo-time-${range.from}-to-${range.to}.csv` };
    }
    case "unbilled": {
      const { entries, truncated } = await listUnbilledEntries(org);
      return truncated ? null : { body: unbilledCsv(groupUnbilled(entries)), filename: `paidlyo-unbilled-${today}.csv` };
    }
    case "outstanding": {
      const { invoices, truncated } = await listOpenInvoices(org);
      return truncated
        ? null
        : { body: outstandingCsv(toOutstanding(invoices, today)), filename: `paidlyo-outstanding-${today}.csv` };
    }
  }
}

/** CSV of a report: ?report=time (default, with the period params) | unbilled | outstanding. Owners/admins only. */
export async function GET(request: NextRequest) {
  const org = await findCurrentOrg();
  if (!org || !canManageOrg(org)) return new Response("Not found", { status: 404 });

  const csv = await buildCsv(org, Object.fromEntries(request.nextUrl.searchParams));
  if (!csv) {
    return new Response(`This report has more than ${MAX_REPORT_ENTRIES} records, too many to export at once. For the time report, choose a shorter period.`, {
      status: 422,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  return new Response(csv.body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${csv.filename}"`,
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}

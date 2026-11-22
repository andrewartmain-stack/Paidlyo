import type { Enums } from "@/types/database";

export type OrgRole = Enums<"org_role">;

export type CurrentOrg = {
  id: string;
  name: string;
  address: string;
  currency: string;
  timezone: string;
  defaultTaxRate: number;
  invoicePrefix: string;
  nextInvoiceNumber: number;
  logoPath: string | null;
  logoUrl: string | null;
  /** Timesheet approval is on: people submit weeks, owners/admins approve them. */
  timesheetApproval: boolean;
  role: OrgRole;
};

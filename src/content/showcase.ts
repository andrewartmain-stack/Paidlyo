/** Copy and data for the landing showcase sections (workflows, product tabs, feature bento). */

export const WORKFLOWS = {
  title: "One place for the whole billing cycle",
  description: "From the first timer to the last payment, every step lives in the same calm workspace.",
  items: [
    {
      id: "track",
      title: "Track",
      subtitle: "Log time in seconds",
      description: "Start a timer or fill in your week. Mark hours billable or not as you go.",
    },
    {
      id: "invoice",
      title: "Invoice",
      subtitle: "Bill unbilled time in a click",
      description: "Pick a client and Paidlyo drafts the invoice from the hours you have not billed yet.",
    },
    {
      id: "get-paid",
      title: "Get paid",
      subtitle: "Share a link, record payments",
      description: "Clients open a branded invoice with no login. Log partial or full payments as they arrive.",
    },
    {
      id: "report",
      title: "Report",
      subtitle: "See where the hours go",
      description: "Slice time and revenue by client, project, task or person, then export to CSV.",
    },
    {
      id: "organize",
      title: "Organize",
      subtitle: "Keep projects on budget",
      description: "Set rates and budgets, approve timesheets and give each teammate the right role.",
    },
  ],
} as const;

export type ProductTabId = "time" | "invoicing" | "client-link" | "payments" | "reports" | "dashboard";

export const PRODUCT_TABS = {
  title: "Everything you need to get paid for every hour",
  description: "Six parts of one product, built to work together.",
  tabs: [
    {
      id: "time",
      label: "Time tracking",
      headline: "Timers and timesheets that stay out of your way",
      features: [
        { title: "One-click timers", description: "Start, stop and switch projects without leaving the page." },
        { title: "Day and week timesheets", description: "Enter hours the way your team already thinks about them." },
        { title: "Copy last week", description: "Repeat a recurring week in a single click." },
        { title: "Billable or not", description: "Flag each entry so internal time never lands on an invoice." },
      ],
    },
    {
      id: "invoicing",
      label: "Invoicing",
      headline: "Invoices built from the time you already tracked",
      features: [
        { title: "Start from unbilled time", description: "Hours arrive priced with the right rate." },
        { title: "Group your way", description: "Group line items by task, project or individual entry." },
        { title: "Discounts and tax", description: "Add either one and the totals update instantly." },
        { title: "Payment terms", description: "Due on receipt, Net 15 to Net 60 or a custom date set the due date for you." },
      ],
    },
    {
      id: "client-link",
      label: "Client link",
      headline: "A branded invoice your client opens in one tap",
      features: [
        { title: "No account needed", description: "Clients view the invoice from a private link." },
        { title: "Branded PDF", description: "Download a clean PDF with your logo and details." },
        { title: "Copy the link", description: "Paste it into email or chat whenever you like." },
      ],
    },
    {
      id: "payments",
      label: "Payments",
      headline: "Know exactly what has been paid",
      features: [
        { title: "Partial payments", description: "Record each payment and see the balance that remains." },
        { title: "Any method", description: "Bank transfer, card, cash or PayPal, logged by you." },
        { title: "Automatic status", description: "Invoices flip to paid once the balance reaches zero." },
      ],
    },
    {
      id: "reports",
      label: "Reports",
      headline: "Answers about your hours and revenue",
      features: [
        { title: "Four ways to slice", description: "By client, project, task or person." },
        { title: "Billable vs unbilled", description: "Spot money waiting to be invoiced." },
        { title: "Budgets with alerts", description: "Get a warning when a project reaches 80% of its budget." },
        { title: "CSV export", description: "Take any report into your spreadsheet." },
      ],
    },
    {
      id: "dashboard",
      label: "Dashboard",
      headline: "Your week at a glance",
      features: [
        { title: "Hours this week", description: "A simple chart of what you and your team logged." },
        { title: "Unbilled and outstanding", description: "See what to invoice and what to chase." },
        { title: "Needs attention", description: "Overdue invoices and budgets close to the limit surface first." },
      ],
    },
  ],
} as const;

export const BENTO = {
  title: "Built for how service teams actually bill",
  description: "The details agencies, consultancies and freelancers ask for, ready on day one.",
  cards: [
    {
      id: "rates",
      title: "Rates per person, project or task",
      description: "Set the right billable rate where it matters and let every invoice pick it up.",
    },
    {
      id: "budget",
      title: "Budget alerts before you overspend",
      description: "Add a budget to a project and get a warning once it passes 80%.",
    },
    {
      id: "link",
      title: "Client link, no login needed",
      description: "Send a private link. Clients see the invoice without creating an account.",
    },
    {
      id: "currency",
      title: "Each client in their own currency",
      description: "Bill in dollars, euros or pounds, with every invoice in the client's currency.",
    },
    {
      id: "approvals",
      title: "Weekly timesheet approvals",
      description: "Managers approve a week or send it back with a note before anything is billed.",
    },
  ],
} as const;

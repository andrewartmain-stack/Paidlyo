/*
 * Landing page copy. Only promise what the product does today (see docs/PROGRESS.md):
 * no online card payments for invoices until item 10b ships. Plan prices live in pricing.ts.
 */

export const SITE = {
  name: "Paidlyo",
  tagline: "Time tracking and invoicing for businesses that bill by the hour",
  description:
    "Paidlyo is simple time tracking and invoicing for agencies, consultancies and freelancers. Turn tracked hours into invoices and switch from Harvest in minutes.",
} as const;

export type NavLink = { href: string; label: string };

/** Header and footer product links (landing page sections until M2/M5 add their own pages). */
export const NAV_LINKS: NavLink[] = [
  { href: "/#features", label: "Features" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#switch-from-harvest", label: "Switch from Harvest" },
  { href: "/pricing", label: "Pricing" },
  { href: "/#faq", label: "FAQ" },
];

export const LEGAL_LINKS: NavLink[] = [
  { href: "/terms", label: "Terms of Service" },
  { href: "/privacy", label: "Privacy Policy" },
];

export const HERO = {
  eyebrow: "The simpler Harvest alternative",
  title: "Time tracking and invoicing for businesses that bill by the hour",
  description:
    "Track your hours, turn them into a branded invoice in one click and see who still owes you. Everything you used in Harvest, with fewer screens.",
  primaryCta: { href: "/signup", label: "Get started" },
  secondaryCta: { href: "/#switch-from-harvest", label: "Switching from Harvest?" },
} as const;

export type Feature = { icon: "clock" | "receipt" | "link" | "banknote" | "chart" | "import"; title: string; text: string };

export const FEATURES: Feature[] = [
  {
    icon: "clock",
    title: "Timesheet and timer",
    text: "Log time by day or by week, or start a timer. Billable and non-billable hours are kept apart, with rates per project or task.",
  },
  {
    icon: "receipt",
    title: "Invoices from unbilled time",
    text: "Pick a client and Paidlyo adds their unbilled hours as invoice lines, grouped by task, project or entry. Edit anything before you send it.",
  },
  {
    icon: "link",
    title: "Branded invoice and client link",
    text: "Your logo and address on every invoice. Share a private link your client can open without an account, or save it as a PDF.",
  },
  {
    icon: "banknote",
    title: "Payment tracking",
    text: "Record full or partial payments by bank transfer, card, cash or PayPal. Invoices move to paid on their own.",
  },
  {
    icon: "chart",
    title: "Reports and CSV export",
    text: "Hours by client, project or task, unbilled time and overdue invoices at a glance. Export any report to CSV.",
  },
  {
    icon: "import",
    title: "Import from Harvest",
    text: "Upload your Harvest time export and bring over clients, projects, tasks and hours. Preview everything before it's saved.",
  },
];

export const STEPS = [
  {
    title: "Bring your data",
    text: "Import your Harvest history or add your first client and project in a minute.",
  },
  {
    title: "Track your time",
    text: "Use the timer or fill in your week. Rates are applied for you, so every hour has a value.",
  },
  {
    title: "Invoice and get paid",
    text: "Create an invoice from unbilled time, send your client the link and record the payment when it arrives.",
  },
] as const;

export const SWITCH = {
  title: "Switching from Harvest takes minutes",
  description:
    "Export the detailed time report from Harvest and upload it to Paidlyo. You'll see exactly what will be created before anything is saved.",
  points: [
    "Clients, projects and tasks are created for you, or matched to the ones you already have",
    "Importing the same file twice never duplicates your time",
    "Time that was already invoiced in Harvest stays out of your next invoice",
    "Your clients get a free, no-login link to view and print each invoice",
  ],
} as const;

export type FaqItem = { question: string; answer: string };

export const FAQ: FaqItem[] = [
  {
    question: "How much does Paidlyo cost?",
    answer:
      "$9 per person a month or $90 per person a year, with every feature and unlimited clients, projects and invoices. Every account starts with a 14-day free trial, and you can cancel any time before you're charged.",
  },
  {
    question: "Who is Paidlyo for?",
    answer:
      "Agencies, studios, consultancies and freelancers who bill clients by the hour: the same businesses that use Harvest, without Harvest's price. Time tracking and invoicing in one simple tool.",
  },
  {
    question: "Can I import my data from Harvest?",
    answer:
      "Yes. Export the detailed time report from Harvest as a CSV and upload it in Paidlyo's settings. You'll see a preview of new clients, projects, tasks and time entries before anything is imported, and duplicates are skipped.",
  },
  {
    question: "Do my clients need an account to see their invoice?",
    answer:
      "No. Every sent invoice has a private link your client can open in any browser to view, print or save it as a PDF.",
  },
  {
    question: "Can I bill clients in different currencies?",
    answer:
      "Yes. Each client has their own currency, and reports keep totals in different currencies apart instead of adding them up.",
  },
  {
    question: "How are invoice amounts calculated?",
    answer:
      "Each time entry keeps the rate that applied when it was tracked, from the project or the task. Invoices add discounts and tax on top, and you can edit every line before sending.",
  },
  {
    question: "Can I record partial payments?",
    answer:
      "Yes. Record each payment with its date and method. The invoice shows the balance due and becomes paid once the full amount is in.",
  },
  {
    question: "Can I export my data?",
    answer:
      "Yes. Time entries, unbilled time and outstanding invoices can all be exported to CSV and opened in Excel, Numbers or Google Sheets.",
  },
];

export const FINAL_CTA = {
  title: "Spend less time on admin and more on paid work",
  description: "Create your account, import from Harvest and send your first invoice today.",
  cta: { href: "/signup", label: "Get started" },
} as const;

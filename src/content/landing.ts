/*
 * Landing page copy. Only promise what the product does today (see docs/PROGRESS.md):
 * no online card payments for invoices until item 10b ships. Plan prices live in pricing.ts.
 */

export const SITE = {
  name: "Paidlyo",
  tagline: "Time tracking and invoicing software for teams that bill by the hour",
  description:
    "Time tracking and invoicing software for agencies, consultancies, small businesses and teams. Track billable hours, invoice clients and switch from Harvest.",
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

export type NavIconKey =
  | "clock"
  | "invoice"
  | "chart"
  | "approval"
  | "rates"
  | "import"
  | "agency"
  | "consultancy"
  | "freelancer"
  | "business";

export type NavItem = {
  title: string;
  description: string;
  icon: NavIconKey;
  /** Fixed destination. Omit when `audienceSlug` decides it. */
  href?: string;
  /** Audience page slug: links to the page once published, else to /#who-its-for. */
  audienceSlug?: string;
};

export type NavGroup = { label: string; columns: 1 | 2; items: NavItem[]; footer?: NavLink };

/** Header dropdown menus (icons are keys; the components map them to lucide icons). */
export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Product",
    columns: 2,
    footer: { href: "/#features", label: "All features" },
    items: [
      { title: "Time tracking", description: "Timers and timesheets in one click.", icon: "clock", href: "/#features" },
      { title: "Invoicing", description: "Turn billable hours into invoices.", icon: "invoice", href: "/#features" },
      { title: "Reports & budgets", description: "Hours, amounts and budget progress per project.", icon: "chart", href: "/#features" },
      { title: "Timesheet approvals", description: "Review and approve weekly hours.", icon: "approval", href: "/#features" },
      { title: "Team & billable rates", description: "Set rates per person and project.", icon: "rates", href: "/#features" },
      { title: "Import from Harvest", description: "Bring your clients and history over.", icon: "import", href: "/#switch-from-harvest" },
    ],
  },
  {
    label: "Solutions",
    columns: 1,
    items: [
      { title: "Agencies & studios", description: "Track client work and bill it fast.", icon: "agency", audienceSlug: "agencies" },
      { title: "Consultancies", description: "Bill expert time with clear reports.", icon: "consultancy", audienceSlug: "consultants" },
      { title: "Freelancers", description: "Simple tracking and invoicing, solo.", icon: "freelancer", audienceSlug: "freelancers" },
      { title: "Small businesses & teams", description: "One place for hours and invoices.", icon: "business", audienceSlug: "small-business" },
    ],
  },
];

/** Plain links shown next to the dropdowns. */
export const NAV_PLAIN_LINKS: NavLink[] = [
  { href: "/pricing", label: "Pricing" },
  { href: "/#switch-from-harvest", label: "Switch from Harvest" },
];

export const LEGAL_LINKS: NavLink[] = [
  { href: "/terms", label: "Terms of Service" },
  { href: "/privacy", label: "Privacy Policy" },
];

export const HERO = {
  eyebrow: "The simpler Harvest alternative",
  title: "Time tracking and invoicing software for teams that bill by the hour",
  description:
    "Track billable hours on a timesheet or timer, turn them into a branded invoice in one click and see who still owes you. All for $9 per person, with every feature included.",
  primaryCta: { href: "/signup", label: "Start your free trial" },
  secondaryCta: { href: "/#switch-from-harvest", label: "Switching from Harvest?" },
  checks: ["14-day free trial", "Every feature included", "Cancel anytime"],
  note: "14-day free trial · Every feature included · Cancel any time",
  videoLabel:
    "Paidlyo demo: the dashboard, tracking time on a timesheet and turning unbilled hours into an invoice.",
} as const;

/** "Who it's for" cards. `slug` links the card to /for/<slug> once that audience page is published. */
export type Audience = {
  slug: string;
  icon: "agency" | "consultancy" | "freelancer" | "business";
  title: string;
  text: string;
};

export const AUDIENCES_INTRO = {
  title: "Built for businesses that sell their time",
  description:
    "Agencies, studios, consultancies, freelancers and small businesses use one tool to track project time and invoice clients.",
} as const;

export const AUDIENCES: Audience[] = [
  {
    slug: "agencies",
    icon: "agency",
    title: "Agencies and studios",
    text: "Track time per client and project, keep project budgets in check and invoice retainers and projects from the same hours.",
  },
  {
    slug: "consultants",
    icon: "consultancy",
    title: "Consultancies",
    text: "Bill by person, project or task rate, and approve each consultant's timesheet before the hours go on an invoice.",
  },
  {
    slug: "freelancers",
    icon: "freelancer",
    title: "Freelancers",
    text: "A timer, a weekly timesheet and a professional invoice for every client, without paying for features you don't use.",
  },
  {
    slug: "small-business",
    icon: "business",
    title: "Small businesses and teams",
    text: "One price per person with everything included, roles for owners, admins and members, and reports by person.",
  },
];

/** Product tour: one row per core workflow. `screenshot` is optional until real app screenshots are added. */
export type TourItem = {
  id: string;
  icon: "clock" | "invoice" | "link" | "chart";
  eyebrow: string;
  title: string;
  text: string;
  points: string[];
  screenshot?: { src: string; alt: string; width: number; height: number };
};

export const TOUR_INTRO = {
  title: "Track billable hours and invoice them without the busywork",
  description: "The four things you do every week, each a few clicks away.",
} as const;

export const TOUR: TourItem[] = [
  {
    id: "timesheet",
    icon: "clock",
    eyebrow: "Time tracking",
    title: "A weekly timesheet and a timer",
    text: "Fill in your week or start a timer when you begin a task. Billable and non-billable hours stay apart, and every entry gets its rate automatically.",
    points: ["Day and week views", "One-click timer", "Copy last week's rows"],
  },
  {
    id: "invoices",
    icon: "invoice",
    eyebrow: "Invoicing",
    title: "Invoices built from unbilled time",
    text: "Pick a client and Paidlyo adds their unbilled hours as invoice lines, grouped by project, task or entry. Add discounts and tax, edit any line, then send.",
    points: ["Lines from tracked time", "Discounts and tax", "Hours are never billed twice"],
  },
  {
    id: "client-link",
    icon: "link",
    eyebrow: "Your client's view",
    title: "A branded invoice your client can open anywhere",
    text: "Every sent invoice has your logo and address and a private link. Your client opens it in any browser, without an account, and can print it or save a PDF.",
    points: ["Your logo and details", "No login for clients", "Print or save as PDF"],
  },
  {
    id: "reports",
    icon: "chart",
    eyebrow: "Reports",
    title: "Reports, budgets and what you're owed",
    text: "See hours by client, project, task or person, how much of each project budget is used, and which invoices are overdue, right on your dashboard.",
    points: ["Hours and amounts by project", "Budget alerts at 80%", "Overdue invoices at a glance"],
  },
];

export type Feature = {
  icon: "gauge" | "check" | "users" | "banknote" | "globe" | "download";
  title: string;
  text: string;
};

export const FEATURES: Feature[] = [
  {
    icon: "gauge",
    title: "Project budgets",
    text: "Set a budget in hours or money on any project. Progress updates as your team tracks time, with a warning at 80%.",
  },
  {
    icon: "check",
    title: "Timesheet approvals",
    text: "Turn on weekly approvals and people submit their week. Managers approve or send it back, and approved weeks are locked.",
  },
  {
    icon: "users",
    title: "Team roles and billable rates",
    text: "Owners, admins and members see what they need. Bill by project, task or each person's own hourly rate.",
  },
  {
    icon: "banknote",
    title: "Payment tracking",
    text: "Record full or partial payments by bank transfer, card, cash or PayPal. Invoices move to paid on their own.",
  },
  {
    icon: "globe",
    title: "Multiple currencies",
    text: "Each client has their own currency, and reports keep totals in different currencies apart instead of adding them up.",
  },
  {
    icon: "download",
    title: "CSV export",
    text: "Export time entries, unbilled time and outstanding invoices to Excel, Numbers or Google Sheets whenever you like.",
  },
];

export const STEPS = [
  {
    icon: "import",
    title: "Bring your data",
    text: "Import your Harvest history or add your first client and project in a minute.",
  },
  {
    icon: "timer",
    title: "Track your time",
    text: "Use the timer or fill in your week. Rates are applied for you, so every billable hour has a value.",
  },
  {
    icon: "invoice",
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

/** Pricing summary on the landing page. Amounts come from PLAN (pricing.ts). */
export const PRICING_SUMMARY = {
  title: "One simple price for the whole team",
  description: "Every feature, unlimited clients, projects and invoices. No tiers and no per-invoice fees.",
  teamSizes: [1, 5, 15],
  trial:
    "Start with a 14-day free trial. You add a card to begin, nothing is charged until the trial ends, and you can cancel in Settings → Billing at any time.",
} as const;

export type TrustItem = { icon: "lock" | "shield" | "card" | "download" | "mail"; title: string; text: string };

/** Only claims that are true today (see docs/ARCHITECTURE.md: RLS, Stripe, CSV export). */
export const TRUST = {
  title: "Your data stays safe and yours",
  description: "Client names, rates and invoices are sensitive. Here's how Paidlyo protects them.",
  items: [
    {
      icon: "shield",
      title: "Isolated per organization",
      text: "Every record belongs to your organization and is protected by database-level access rules, so no other account can read it.",
    },
    {
      icon: "lock",
      title: "Encrypted",
      text: "All traffic is sent over HTTPS, and your data is encrypted at rest by our database provider.",
    },
    {
      icon: "card",
      title: "Payments handled by Stripe",
      text: "Your subscription is billed through Stripe. Card details never touch Paidlyo's servers.",
    },
    {
      icon: "download",
      title: "No lock-in",
      text: "Export your time entries and invoices to CSV whenever you like, and cancel in a couple of clicks.",
    },
  ] satisfies TrustItem[],
} as const;

/** "Ask an AI about us": each link opens the assistant with this question pre-filled. */
const ASK_AI_PROMPT =
  "What is Paidlyo (paidlyo.com)? Is it good time tracking and invoicing software for agencies, consultancies and small teams? Summarize its features and price per person.";

export const ASK_AI = {
  title: "Don't take our word for it",
  description: "Ask your favourite AI assistant what it thinks of Paidlyo. We'll open it with the question ready to send.",
  prompt: ASK_AI_PROMPT,
  assistants: [
    { name: "ChatGPT", logo: "chatgpt", url: `https://chatgpt.com/?q=${encodeURIComponent(ASK_AI_PROMPT)}` },
    { name: "Claude", logo: "claude", url: `https://claude.ai/new?q=${encodeURIComponent(ASK_AI_PROMPT)}` },
    { name: "Gemini", logo: "gemini", url: `https://www.google.com/search?udm=50&q=${encodeURIComponent(ASK_AI_PROMPT)}` },
    { name: "Perplexity", logo: "perplexity", url: `https://www.perplexity.ai/search?q=${encodeURIComponent(ASK_AI_PROMPT)}` },
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
      "Agencies, studios, consultancies, small businesses, teams and freelancers who bill clients by the hour: the same businesses that use Harvest, without Harvest's price. Time tracking and invoicing in one simple tool.",
  },
  {
    question: "Is my data secure?",
    answer:
      "Yes. Each organization's data is isolated by database-level access rules, all traffic is encrypted over HTTPS and data is encrypted at rest. Payments are handled by Stripe, so we never see your card details.",
  },
  {
    question: "Can I track time for a whole team?",
    answer:
      "Yes. Invite your team as admins or members, set each person's billable rate, see hours by person in reports and, if you want, approve everyone's weekly timesheet before it's invoiced.",
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
  cta: { href: "/signup", label: "Start your free trial" },
} as const;

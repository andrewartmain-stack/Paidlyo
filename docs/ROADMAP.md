# Roadmap

Each item is one or more small, independently verifiable features. Don't start an item
before its prerequisites are stable and committed. Scope rationale: docs/PRODUCT.md.

## MVP: "switch from Harvest, track time, invoice it, get paid"
| # | Feature | Depends on | Notes |
|---|---|---|---|
| 0 | Project foundation | — | ✅ done |
| 1 | Design tokens & app shell | 0 | ✅ done · Tokens from `design_system.html`; `/app` sidebar layout (noindex) |
| 2 | Authentication | 0 | ✅ done · Supabase email+password, `proxy.ts`, protected routes (magic link / Google later) |
| 3 | Organization onboarding & settings | 2 | ✅ done · Name, logo, address, default currency, default tax, invoice prefix |
| 4 | Clients | 3 | ✅ done · CRUD, archive, currency per client |
| 5 | Projects & tasks | 4 | ✅ done · Billable flag, billing method (project rate / task rate / none), budget field |
| 6 | Time tracking | 5 | ✅ done (6a day view + timer, 6b week grid) · Weekly timesheet + day view + running timer, billable vs non-billable |
| 7 | Invoices | 4, 6 | 7a manual invoices ✅ done · 7b from unbilled time ✅ done · Manual line items **and** one-click from unbilled time; drafts; tax, discount; numbering; statuses |
| 8 | Invoice view, PDF & client link | 7 | 8a preview + PDF ✅ done · 8b client link ✅ done · Branded print page → PDF, no-login `/i/[token]` |
| 9 | ~~Sending invoices by email~~ | 8 | ⏭ skipped (user decision 2026-11-20): users share the client link (8b) themselves |
| 10 | Payments | 8 | 10a manual payments ✅ done · 10b Stripe Connect + Checkout, webhook marks paid (deferred) |
| 11 | Reports & CSV export | 6, 7 | 11a time report + CSV ✅ done · 11b unbilled + outstanding ✅ done · Unbilled time, outstanding invoices, hours by client/project/task |
| 12 | Harvest importer | 4, 5, 6, 7 | 12a CSV import ✅ done · 12b API import (invoices, people) · Harvest API token or CSV; preview new/updated/duplicate before import |
| 13 | SaaS subscription billing | 3 | 13a checkout + portal + webhook + trial ✅ done · 13b read-only when lapsed ✅ done · One plan + 14-day trial, Stripe Billing + Customer Portal |

## Marketing site track (paidlyo.com, indexed)
Independent of the dashboard after item 1, so it's a good candidate for a parallel worktree.
| # | Feature | Depends on | Notes |
|---|---|---|---|
| M1 | Marketing layout & SEO foundation | 1 | ✅ done · Header nav, mobile menu, footer, landing page sections, metadata defaults, `sitemap.ts`, `robots.ts`, OG image, Organization/WebSite JSON-LD |
| M2 | Features pages | M1 | `/features` + one page per feature |
| M3 | Pricing & legal pages | M1 | ✅ code done · Pricing, privacy, terms (Stripe requires legal pages) |
| M4 | Blog / articles | M1 | List, article page, categories, BlogPosting JSON-LD; content format decision |
| M5 | Alternatives & comparisons | M1 | `/alternatives/harvest`, `/compare/...` — highest-intent pages |
| M6 | Programmatic SEO & free tools | M4, M5 | Templates by profession, invoice generator, rate calculator |

Before launch: M1–M3 at minimum, plus Google Search Console + sitemap submitted.

## V1: "small agencies"
| # | Feature | Depends on |
|---|---|---|
| 14 | Team members, roles & person rates | 3, 5 |
| 15 | Expenses with receipt upload (Supabase Storage), billable to invoices | 5, 7 |
| 16 | Credit notes | 7 |
| 17 | Project budgets & overrun alerts | 6 |
| 18 | Estimates / quotes → invoice | 7 |
| 19 | Recurring invoices & payment reminders | 9 |
| 20 | Utilization & profitability reports | 11, 14 |
| 21 | Time off (PTO/holiday/sick categories, balances, shown on timesheet) | 6, 14 |
| 22 | Timesheet approvals (submit week → manager approves/rejects, locks entries) | 6, 14 |
| 23 | Recurring time entries & copy previous day/week | 6 |
| 24 | Dashboards (hours, billable %, revenue, outstanding — charts on `/app`) | 11 |

## Later (only when customers ask)
Integrations page: Calendar sync (Google/Outlook) · QuickBooks/Xero · Slack · Public API ·
Mileage · AI assistant / AI-agent time tracking.
